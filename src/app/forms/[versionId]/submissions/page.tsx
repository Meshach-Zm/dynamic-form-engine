import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  payload: Record<string, unknown>
  createdAt: string
}

async function getData(versionId: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [vRes, sRes] = await Promise.all([
    fetch(`${base}/api/forms/version/${versionId}`, { cache: 'no-store' }),
    fetch(`${base}/api/forms/version/${versionId}/submissions`, { cache: 'no-store' }),
  ])
  if (!vRes.ok) return null
  const version = (await vRes.json()).data
  const submissions: Submission[] = sRes.ok ? (await sRes.json()).data : []
  return { version, submissions }
}

export default async function SubmissionsPage({ params }: { params: { versionId: string } }) {
  const data = await getData(params.versionId)
  if (!data) notFound()
  const { version, submissions } = data

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Submissions</h1>
          <p className="page-sub">{version.formTemplate.name} · v{version.versionNumber}</p>
        </div>
        <Link href={`/forms/${params.versionId}`} className="btn btn--ghost btn--sm">
          View form
        </Link>
      </div>

      {submissions.length === 0 ? (
        <p className="empty">No submissions yet.</p>
      ) : (
        <div className="submission-list">
          {submissions.map((s) => (
            <div key={s.id} className="submission-card">
              <div className="submission-card__meta">
                <span className="submission-card__id">{s.id.slice(-8)}</span>
                <span className="submission-card__date">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
              </div>
              <dl className="payload">
                {Object.entries(s.payload).map(([k, v]) => (
                  <div key={k} className="payload__row">
                    <dt className="payload__key">{k}</dt>
                    <dd className="payload__val">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
