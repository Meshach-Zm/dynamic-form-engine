import { NextRequest, NextResponse } from 'next/server'
import { formTemplateService } from '@/modules/form-template/form-template.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    return NextResponse.json({ data: await formTemplateService.getTemplate(id) })
  } catch (err: any) {
    if (err.message === 'TEMPLATE_NOT_FOUND')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
