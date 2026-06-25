import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'

interface FormVersion {
  id: string
  versionNumber: number
  schema: Record<string, unknown>
  formTemplate: { id: string; name: string }
}

async function getVersion(versionId: string): Promise<FormVersion | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/forms/version/${versionId}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()).data
}

export default async function FormPage({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { versionId } = await params
  const { mode } = await searchParams
  const readOnly = mode === 'view'

  const version = await getVersion(versionId)
  if (!version) notFound()

  return (
    <main className="page page--narrow">
      <div className="page-header">
        <p className="page-sub">
          v{version.versionNumber}
          {readOnly && ' · Read-only'}
        </p>

        <div className="flex gap-2">
          <Link href="/" className="btn btn--ghost btn--sm">
            Home
          </Link>

          <Link
            href={`/forms/${version.formTemplate.id}/submissions`}
            className="btn btn--ghost btn--sm"
          >
            View submissions
          </Link>
        </div>
      </div>

      <FormRenderer
        schema={version.schema as any}
        formVersionId={version.id}
        formName={version.formTemplate.name}
      />
    </main>
  )
}