import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = await formTemplateService.getTemplate(params.id)
    return NextResponse.json({ data: template })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND') {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
