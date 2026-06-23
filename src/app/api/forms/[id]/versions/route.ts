import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'
import { CreateFormVersionSchema } from '@/modules/form-template/form-template.types'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = CreateFormVersionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }
    const version = await formTemplateService.publishNewVersion(params.id, parsed.data)
    return NextResponse.json({ data: version }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND') {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
