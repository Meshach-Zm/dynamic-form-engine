import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'
import { CreateFormTemplateSchema } from '@/modules/form-template/form-template.types'

export async function GET() {
  try {
    const templates = await formTemplateService.listTemplates()
    return NextResponse.json({ data: templates })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateFormTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }
    const template = await formTemplateService.createTemplate(parsed.data)
    return NextResponse.json({ data: template }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
