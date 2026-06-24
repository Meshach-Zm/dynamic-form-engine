import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'

interface Submission {
    id: string
    payload: Record<string, unknown>
    createdAt: string
}

interface VersionWithTemplate {
    id: string
    versionNumber: number
    formTemplate: { id: string; name: string }
}

async function getData(versionId: string) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const [vRes, sRes] = await Promise.all([
        fetch(`${base}/api/forms/version/${versionId}`, { cache: 'no-store' }),
        fetch(`${base}/api/forms/version/${versionId}/submissions`, { cache: 'no-store' }),
    ])
    if (!vRes.ok) return null
    const version: VersionWithTemplate = (await vRes.json()).data
    const submissions: Submission[] = sRes.ok ? (await sRes.json()).data : []
    return { version, submissions }
}

export default async function SubmissionsPage({ params }: { params: Promise<{ versionId: string }> }) {
    const { versionId } = await params
    const data = await getData(versionId)
    if (!data) notFound()
    const { version, submissions } = data

    return (
        <main className="page">
            <div className="page-header">
                <div>
                    <h1>Submissions</h1>
                    <p className="page-sub">{version.formTemplate.name} · v{version.versionNumber}</p>
                </div>
                <Link href={`/forms/${version.formTemplate.id}` as Route} className="btn btn--ghost btn--sm">
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