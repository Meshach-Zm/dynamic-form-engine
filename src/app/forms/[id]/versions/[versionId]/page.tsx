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

export default async function FormPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params
  const version = await getVersion(versionId)
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
