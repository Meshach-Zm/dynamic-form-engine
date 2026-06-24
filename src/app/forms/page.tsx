import Link from 'next/link'

interface FormTemplate {
  id: string
  name: string
  createdAt: string
  versions: { id: string; versionNumber: number }[]
}

async function getForms(): Promise<FormTemplate[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/forms`, { cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).data
}

export default async function FormsPage() {
  const forms = await getForms()

  return (
    <main className="page">
      <div className="page-header">
        <h1>Forms</h1>
        <Link href="/forms/new" className="btn btn--sm">+ New form</Link>
      </div>

      {forms.length === 0 ? (
        <p className="empty">No forms yet. <Link href="/forms/new">Create one</Link> or run <code>npm run db:seed</code>.</p>
      ) : (
        <ul className="form-list">
          {forms.map(f => {
            const latest = f.versions[0]
            return (
              <li key={f.id} className="form-card">
                <div>
                  <p className="form-card__name">{f.name}</p>
                  <p className="form-card__meta">
                    {latest ? `v${latest.versionNumber}` : 'No versions'} ·{' '}
                    {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {latest && (
                  <div className="form-card__actions">
                    <Link href={`/forms/${latest.id}`} className="btn btn--sm">
                      Fill form
                    </Link>
                    <Link href={`/forms/${latest.id}/submissions`} className="btn btn--ghost btn--sm">
                      Submissions
                    </Link>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
