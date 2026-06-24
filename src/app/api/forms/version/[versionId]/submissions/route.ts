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
