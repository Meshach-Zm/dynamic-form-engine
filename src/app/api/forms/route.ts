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
