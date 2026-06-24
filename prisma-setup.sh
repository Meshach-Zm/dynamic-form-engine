#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $1"; }
info() { echo -e "${CYAN}[info]${NC}  $1"; }
die()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# must be inside the project
[ -f "package.json" ] || die "Run this from inside your dynamic-form-engine folder."

# =============================================================================
# 1. FILL IN PHASE 2 — files that were skipped
# =============================================================================
log "Writing missing phase-2 files..."

# Neon-aware prisma client
cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF

# AJV singleton
mkdir -p src/lib
cat > src/lib/ajv.ts << 'EOF'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export { ajv }
EOF

# Validation service
mkdir -p src/modules/validation
cat > src/modules/validation/validation.service.ts << 'EOF'
import { ajv } from '@/lib/ajv'

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}

export const validationService = {
  validate(schema: object, payload: unknown): ValidationResult {
    const validate = ajv.compile(schema)
    const valid = validate(payload)
    if (valid) return { valid: true, errors: [] }

    const errors = (validate.errors ?? []).map((err) => ({
      field: err.instancePath?.replace(/^\//, '') || (err.params as any)?.missingProperty || 'unknown',
      message: err.message ?? 'Invalid value',
    }))

    return { valid: false, errors }
  },
}
EOF

# Form template types
mkdir -p src/modules/form-template
cat > src/modules/form-template/form-template.types.ts << 'EOF'
import { z } from 'zod'

export const CreateFormTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  schema: z.record(z.unknown()),
})

export const CreateFormVersionSchema = z.object({
  schema: z.record(z.unknown()),
})

export type CreateFormTemplateInput = z.infer<typeof CreateFormTemplateSchema>
export type CreateFormVersionInput  = z.infer<typeof CreateFormVersionSchema>
EOF

# Form template repository
cat > src/modules/form-template/form-template.repository.ts << 'EOF'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const formTemplateRepository = {
  async create(data: Prisma.FormTemplateCreateInput) {
    return prisma.formTemplate.create({ data })
  },
  async findAll() {
    return prisma.formTemplate.findMany({
      include: { versions: { where: { isLatest: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })
  },
  async findById(id: string) {
    return prisma.formTemplate.findUnique({
      where: { id },
      include: { versions: { where: { isLatest: true }, take: 1 } },
    })
  },
}

export const formVersionRepository = {
  async findLatest(formTemplateId: string) {
    return prisma.formVersion.findFirst({ where: { formTemplateId, isLatest: true } })
  },
  async findById(id: string) {
    return prisma.formVersion.findUnique({
      where: { id },
      include: { formTemplate: { select: { name: true } } },
    })
  },
  async createNewVersion(formTemplateId: string, schema: object) {
    return prisma.$transaction(async (tx) => {
      await tx.formVersion.updateMany({
        where: { formTemplateId, isLatest: true },
        data: { isLatest: false },
      })
      const count = await tx.formVersion.count({ where: { formTemplateId } })
      return tx.formVersion.create({
        data: { formTemplateId, versionNumber: count + 1, schema, isLatest: true },
      })
    })
  },
}
EOF

# Form template service
cat > src/modules/form-template/form-template.service.ts << 'EOF'
import { formTemplateRepository, formVersionRepository } from './form-template.repository'
import type { CreateFormTemplateInput, CreateFormVersionInput } from './form-template.types'

export const formTemplateService = {
  async createTemplate(input: CreateFormTemplateInput) {
    return formTemplateRepository.create({
      name: input.name,
      versions: {
        create: { versionNumber: 1, schema: input.schema, isLatest: true },
      },
    })
  },
  async listTemplates() {
    return formTemplateRepository.findAll()
  },
  async getTemplate(id: string) {
    const t = await formTemplateRepository.findById(id)
    if (!t) throw new Error('TEMPLATE_NOT_FOUND')
    return t
  },
  async publishNewVersion(formTemplateId: string, input: CreateFormVersionInput) {
    const t = await formTemplateRepository.findById(formTemplateId)
    if (!t) throw new Error('TEMPLATE_NOT_FOUND')
    return formVersionRepository.createNewVersion(formTemplateId, input.schema)
  },
}
EOF

# Submission types
mkdir -p src/modules/submission
cat > src/modules/submission/submission.types.ts << 'EOF'
import { z } from 'zod'

export const CreateSubmissionSchema = z.object({
  payload: z.record(z.unknown()),
})

export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>
EOF

# Submission repository
cat > src/modules/submission/submission.repository.ts << 'EOF'
import { prisma } from '@/lib/prisma'

export const submissionRepository = {
  async create(formVersionId: string, payload: object) {
    return prisma.submission.create({ data: { formVersionId, payload } })
  },
  async findByVersionId(formVersionId: string) {
    return prisma.submission.findMany({
      where: { formVersionId },
      orderBy: { createdAt: 'desc' },
    })
  },
}
EOF

# Submission service
cat > src/modules/submission/submission.service.ts << 'EOF'
import { formVersionRepository } from '@/modules/form-template/form-template.repository'
import { validationService } from '@/modules/validation/validation.service'
import { submissionRepository } from './submission.repository'
import type { CreateSubmissionInput } from './submission.types'

export const submissionService = {
  async submit(formVersionId: string, input: CreateSubmissionInput) {
    const version = await formVersionRepository.findById(formVersionId)
    if (!version) throw new Error('VERSION_NOT_FOUND')

    const result = validationService.validate(version.schema as object, input.payload)
    if (!result.valid) {
      const err = new Error('VALIDATION_FAILED')
      ;(err as any).details = result.errors
      throw err
    }

    return submissionRepository.create(formVersionId, input.payload)
  },
  async listByVersion(formVersionId: string) {
    const version = await formVersionRepository.findById(formVersionId)
    if (!version) throw new Error('VERSION_NOT_FOUND')
    return submissionRepository.findByVersionId(formVersionId)
  },
}
EOF

# FormRenderer component
mkdir -p src/components/form-renderer
cat > src/components/form-renderer/FormRenderer.tsx << 'EOF'
'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'

interface FieldSchema {
  type: string
  description?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  format?: string
  enum?: string[]
}

interface JsonSchema {
  type: string
  required?: string[]
  properties: Record<string, FieldSchema>
}

interface ValidationError { field: string; message: string }

interface Props {
  schema: JsonSchema
  formVersionId: string
  formName: string
}

export function FormRenderer({ schema, formVersionId, formName }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [serverErrors, setServerErrors] = useState<ValidationError[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data: Record<string, unknown>) => {
    setStatus('loading')
    setServerErrors([])
    try {
      const res = await fetch(`/api/forms/version/${formVersionId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: data }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerErrors(json.details ?? [{ field: 'form', message: json.error ?? 'Failed.' }])
        setStatus('error')
        return
      }
      setStatus('success')
      reset()
    } catch {
      setServerErrors([{ field: 'form', message: 'Network error. Try again.' }])
      setStatus('error')
    }
  }

  const required = schema.required ?? []
  const fields = Object.entries(schema.properties)

  return (
    <div className="form-wrap">
      <h1 className="form-title">{formName}</h1>

      {status === 'success' && (
        <div className="alert alert--success" role="alert">Submitted successfully.</div>
      )}
      {status === 'error' && serverErrors.find(e => e.field === 'form') && (
        <div className="alert alert--error" role="alert">
          {serverErrors.find(e => e.field === 'form')?.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {fields.map(([key, field]) => {
          const isRequired = required.includes(key)
          const fieldError = serverErrors.find(e => e.field === key)

          return (
            <div key={key} className="field">
              <label className="label" htmlFor={key}>
                {field.description ?? key}
                {isRequired && <span className="required" aria-hidden="true"> *</span>}
              </label>

              {field.enum ? (
                <select
                  id={key}
                  className={`input${fieldError ? ' input--error' : ''}`}
                  {...register(key, { required: isRequired ? 'Required' : false })}
                >
                  <option value="">Select…</option>
                  {field.enum.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.type === 'string' && (field.maxLength ?? 0) > 200 ? (
                <textarea
                  id={key}
                  rows={4}
                  className={`input input--textarea${fieldError ? ' input--error' : ''}`}
                  {...register(key, {
                    required: isRequired ? 'Required' : false,
                    minLength: field.minLength ? { value: field.minLength, message: `Min ${field.minLength} chars` } : undefined,
                    maxLength: field.maxLength ? { value: field.maxLength, message: `Max ${field.maxLength} chars` } : undefined,
                  })}
                />
              ) : (
                <input
                  id={key}
                  type={
                    field.format === 'email' ? 'email'
                    : field.type === 'integer' || field.type === 'number' ? 'number'
                    : field.type === 'boolean' ? 'checkbox'
                    : 'text'
                  }
                  className={`input${field.type === 'boolean' ? ' input--checkbox' : ''}${fieldError ? ' input--error' : ''}`}
                  {...register(key, {
                    required: isRequired ? 'Required' : false,
                    min: field.minimum !== undefined ? { value: field.minimum, message: `Min ${field.minimum}` } : undefined,
                    max: field.maximum !== undefined ? { value: field.maximum, message: `Max ${field.maximum}` } : undefined,
                    minLength: field.minLength ? { value: field.minLength, message: `Min ${field.minLength} chars` } : undefined,
                    valueAsNumber: field.type === 'integer' || field.type === 'number',
                  })}
                />
              )}

              {errors[key] && (
                <span className="field-error" role="alert">{errors[key]?.message as string}</span>
              )}
              {fieldError && (
                <span className="field-error" role="alert">{fieldError.message}</span>
              )}
            </div>
          )
        })}

        <button type="submit" className="btn" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
EOF

# API routes
mkdir -p "src/app/api/forms/[id]/versions"
mkdir -p "src/app/api/forms/version/[versionId]/submissions"
mkdir -p "src/app/api/forms/version/[versionId]"

cat > src/app/api/forms/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'
import { CreateFormTemplateSchema } from '@/modules/form-template/form-template.types'

export async function GET() {
  try {
    return NextResponse.json({ data: await formTemplateService.listTemplates() })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = CreateFormTemplateSchema.safeParse(await req.json())
    if (!parsed.success)
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    return NextResponse.json({ data: await formTemplateService.createTemplate(parsed.data) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

cat > "src/app/api/forms/[id]/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({ data: await formTemplateService.getTemplate(params.id) })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

cat > "src/app/api/forms/[id]/versions/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'
import { CreateFormVersionSchema } from '@/modules/form-template/form-template.types'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parsed = CreateFormVersionSchema.safeParse(await req.json())
    if (!parsed.success)
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    const version = await formTemplateService.publishNewVersion(params.id, parsed.data)
    return NextResponse.json({ data: version }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

cat > "src/app/api/forms/version/[versionId]/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { formVersionRepository } from '@/modules/form-template/form-template.repository'

export async function GET(_req: NextRequest, { params }: { params: { versionId: string } }) {
  try {
    const version = await formVersionRepository.findById(params.versionId)
    if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: version })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

cat > "src/app/api/forms/version/[versionId]/submissions/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { submissionService } from '@/modules/submission/submission.service'
import { CreateSubmissionSchema } from '@/modules/submission/submission.types'

export async function POST(req: NextRequest, { params }: { params: { versionId: string } }) {
  try {
    const parsed = CreateSubmissionSchema.safeParse(await req.json())
    if (!parsed.success)
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    const submission = await submissionService.submit(params.versionId, parsed.data)
    return NextResponse.json({ data: submission }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'VERSION_NOT_FOUND')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (err.message === 'VALIDATION_FAILED')
      return NextResponse.json({ error: 'Form validation failed', details: err.details }, { status: 422 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: { versionId: string } }) {
  try {
    return NextResponse.json({ data: await submissionService.listByVersion(params.versionId) })
  } catch (err: any) {
    if (err.message === 'VERSION_NOT_FOUND')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

# =============================================================================
# 2. INSTALL DEPS
# =============================================================================
log "Installing dependencies..."
npm install

# =============================================================================
# 3. START POSTGRES
# =============================================================================
log "Starting Postgres via Docker..."
docker compose up -d

log "Waiting for Postgres to be ready..."
until docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
log "Postgres is ready."

# =============================================================================
# 4. PRISMA GENERATE + MIGRATE + SEED
# =============================================================================
log "Generating Prisma client..."
npx prisma generate

log "Running migrations..."
npx prisma migrate dev --name init

log "Seeding database..."
npm run db:seed

# =============================================================================
# 5. RUN TESTS
# =============================================================================
log "Running tests..."
npm test

# =============================================================================
# 6. COMMIT
# =============================================================================
git add .
git commit -m "chore: install deps, migrate, seed — project is runnable"

echo ""
echo -e "${GREEN}=============================${NC}"
echo -e "${GREEN}  Ready. Run: npm run dev${NC}"
echo -e "${GREEN}  Open: http://localhost:3000${NC}"
echo -e "${GREEN}=============================${NC}"