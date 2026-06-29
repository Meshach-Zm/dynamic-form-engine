import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'
import { CreateFormVersionSchema } from '@/modules/form-template/form-template.types'

type VersionRouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  _req: NextRequest,
  { params }: VersionRouteContext,
) {
  const { id } = await params

  try {
    const versions = await formTemplateService.getVersions(id)

    return NextResponse.json({
      data: versions.map(v => ({
        id: v.id,
        versionNumber: v.versionNumber,
        isLatest: v.isLatest,
        createdAt: v.createdAt.toISOString(),
        _count: v._count || { submissions: 0 },
      })),
    })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 },
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: VersionRouteContext,
) {
  const { id } = await params

  try {
    const body = await req.json()
    const parsed = CreateFormVersionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const version = await formTemplateService.publishNewVersion(
      id,
      parsed.data,
    )

    return NextResponse.json({
      data: {
        id: version.id,
        versionNumber: version.versionNumber,
        createdAt: version.createdAt.toISOString(),
        isLatest: version.isLatest,
      }
    }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 },
      )
    }
    if (err.message === 'SCHEMA_UNCHANGED') {
      return NextResponse.json(
        { error: 'Schema is identical to the current version' },
        { status: 400 },
      )
    }
    console.error('POST /api/forms/[id]/versions failed:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}