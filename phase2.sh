#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[setup]${NC} $1"; }

# =============================================================================
# FORM ADMIN — create a form template via UI (not just seed)
# =============================================================================
log "Building form admin create page..."
mkdir -p src/app/forms/new

cat > src/app/forms/new/page.tsx << 'EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STARTER_SCHEMA = JSON.stringify(
  {
    type: 'object',
    required: ['fullName', 'email'],
    additionalProperties: false,
    properties: {
      fullName: { type: 'string', minLength: 2, description: 'Full name' },
      email:    { type: 'string', format: 'email', description: 'Email address' },
    },
  },
  null,
  2
)

export default function NewFormPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [schema, setSchema] = useState(STARTER_SCHEMA)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    let parsed
    try {
      parsed = JSON.parse(schema)
    } catch {
      setError('Schema is not valid JSON.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, schema: parsed }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed.'); return }
      router.push('/forms')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page page--narrow">
      <div className="page-header">
        <h1>New form</h1>
        <a href="/forms" className="btn btn--ghost btn--sm">Cancel</a>
      </div>

      <div className="form-wrap">
        <div className="field">
          <label className="label" htmlFor="name">Form name <span className="required">*</span></label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Volunteer Registration"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="schema">JSON Schema <span className="required">*</span></label>
          <textarea
            id="schema"
            className="input input--textarea input--mono"
            rows={16}
            value={schema}
            onChange={e => setSchema(e.target.value)}
            spellCheck={false}
          />
          <span className="hint">
            Fields render from <code>properties</code>. Use <code>description</code> as the label.
          </span>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <button className="btn" onClick={submit} disabled={loading || !name.trim()}>
          {loading ? 'Creating…' : 'Create form'}
        </button>
      </div>
    </main>
  )
}
EOF

# =============================================================================
# SUBMISSIONS LIST PAGE — reviewer can see all submissions for a version
# =============================================================================
log "Building submissions list page..."
mkdir -p "src/app/forms/[versionId]/submissions"

cat > "src/app/forms/[versionId]/submissions/page.tsx" << 'EOF'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  payload: Record<string, unknown>
  createdAt: string
}

async function getData(versionId: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [vRes, sRes] = await Promise.all([
    fetch(`${base}/api/forms/version/${versionId}`, { cache: 'no-store' }),
    fetch(`${base}/api/forms/version/${versionId}/submissions`, { cache: 'no-store' }),
  ])
  if (!vRes.ok) return null
  const version = (await vRes.json()).data
  const submissions: Submission[] = sRes.ok ? (await sRes.json()).data : []
  return { version, submissions }
}

export default async function SubmissionsPage({ params }: { params: { versionId: string } }) {
  const data = await getData(params.versionId)
  if (!data) notFound()
  const { version, submissions } = data

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Submissions</h1>
          <p className="page-sub">{version.formTemplate.name} · v{version.versionNumber}</p>
        </div>
        <Link href={`/forms/${params.versionId}`} className="btn btn--ghost btn--sm">
          View form
        </Link>
      </div>

      {submissions.length === 0 ? (
        <p className="empty">No submissions yet.</p>
      ) : (
        <div className="submission-list">
          {submissions.map((s) => (
            <div key={s.id} className="submission-card">
              <div className="submission-card__meta">
                <span className="submission-card__id">{s.id.slice(-8)}</span>
                <span className="submission-card__date">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
              </div>
              <dl className="payload">
                {Object.entries(s.payload).map(([k, v]) => (
                  <div key={k} className="payload__row">
                    <dt className="payload__key">{k}</dt>
                    <dd className="payload__val">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
EOF

# =============================================================================
# UPDATE FORMS LIST — add "New form" button + submissions link
# =============================================================================
cat > src/app/forms/page.tsx << 'EOF'
import Link from 'next/link'

interface FormTemplate {
  id: string
  name: string
  createdAt: string
  versions: { id: string; versionNumber: number }[]
}

async function getForms(): Promise<FormTemplate[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/forms`, { cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).data
}

export default async function FormsPage() {
  const forms = await getForms()

  return (
    <main className="page">
      <div className="page-header">
        <h1>Forms</h1>
        <Link href="/forms/new" className="btn btn--sm">+ New form</Link>
      </div>

      {forms.length === 0 ? (
        <p className="empty">No forms yet. <Link href="/forms/new">Create one</Link> or run <code>npm run db:seed</code>.</p>
      ) : (
        <ul className="form-list">
          {forms.map(f => {
            const latest = f.versions[0]
            return (
              <li key={f.id} className="form-card">
                <div>
                  <p className="form-card__name">{f.name}</p>
                  <p className="form-card__meta">
                    {latest ? `v${latest.versionNumber}` : 'No versions'} ·{' '}
                    {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {latest && (
                  <div className="form-card__actions">
                    <Link href={`/forms/${latest.id}`} className="btn btn--sm">
                      Fill form
                    </Link>
                    <Link href={`/forms/${latest.id}/submissions`} className="btn btn--ghost btn--sm">
                      Submissions
                    </Link>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
EOF

# =============================================================================
# UPDATE FORM DETAIL PAGE — add submissions link after success
# =============================================================================
cat > "src/app/forms/[versionId]/page.tsx" << 'EOF'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'

interface FormVersion {
  id: string
  versionNumber: number
  schema: Record<string, unknown>
  formTemplate: { name: string }
}

async function getVersion(versionId: string): Promise<FormVersion | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/forms/version/${versionId}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()).data
}

export default async function FormPage({ params }: { params: { versionId: string } }) {
  const version = await getVersion(params.versionId)
  if (!version) notFound()

  return (
    <main className="page page--narrow">
      <div className="page-header">
        <p className="page-sub">v{version.versionNumber}</p>
        <Link href={`/forms/${version.id}/submissions`} className="btn btn--ghost btn--sm">
          View submissions
        </Link>
      </div>
      <FormRenderer
        schema={version.schema as any}
        formVersionId={version.id}
        formName={version.formTemplate.name}
      />
    </main>
  )
}
EOF

# =============================================================================
# UPDATE GLOBAL CSS — add missing utility classes
# =============================================================================
cat >> src/app/globals.css << 'EOF'

/* Ghost button */
.btn--ghost {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--border);
}
.btn--ghost:hover:not(:disabled) { background: var(--bg); }

/* Page sub-heading */
.page-sub { font-size: 0.875rem; color: var(--muted); margin-top: 0.125rem; }

/* Mono textarea */
.input--mono { font-family: var(--mono); font-size: 0.875rem; }

/* Hint text */
.hint { font-size: 0.8125rem; color: var(--muted); }

/* Form card actions */
.form-card__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

/* Submissions */
.submission-list { display: flex; flex-direction: column; gap: 1rem; }

.submission-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
}

.submission-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.submission-card__id {
  font-family: var(--mono);
  font-size: 0.8125rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  color: var(--muted);
}

.submission-card__date { font-size: 0.8125rem; color: var(--muted); }

.payload { display: flex; flex-direction: column; gap: 0.375rem; }

.payload__row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  font-size: 0.9375rem;
}

.payload__key { color: var(--muted); font-size: 0.875rem; padding-top: 0.05rem; }
.payload__val { word-break: break-word; }

@media (max-width: 480px) {
  .payload__row { grid-template-columns: 1fr; gap: 0.125rem; }
  .payload__key { font-size: 0.8125rem; }
}
EOF

# =============================================================================
# NOT FOUND PAGE
# =============================================================================
cat > src/app/not-found.tsx << 'EOF'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page page--narrow" style={{ textAlign: 'center', paddingTop: '6rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--border)' }}>404</h1>
      <p style={{ color: 'var(--muted)', margin: '0.75rem 0 1.5rem' }}>Page not found.</p>
      <Link href="/forms" className="btn">Back to forms</Link>
    </main>
  )
}
EOF

# =============================================================================
# COMMIT
# =============================================================================
git add .
git commit -m "feat: form create page, submissions list, nav links, 404"

echo ""
echo -e "${GREEN}Done.${NC}"
echo "  npm run dev   → /forms, /forms/new, /forms/:id, /forms/:id/submissions"