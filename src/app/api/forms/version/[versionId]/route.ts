import { NextRequest, NextResponse } from 'next/server'
import { formVersionRepository } from '@/modules/form-template/form-template.repository'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params

  try {
    const version = await formVersionRepository.findById(versionId)
    if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: version })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}