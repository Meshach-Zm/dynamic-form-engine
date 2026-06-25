import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'

interface Submission {
    id: string
    payload: Record<string, unknown>
    createdAt: string
}

interface FormTemplate {
    id: string
    name: string
    latestVersion: {
        id: string
        versionNumber: number
    } | null
}

async function getData(formId: string) {
    const base =
        process.env.NEXT_PUBLIC_BASE_URL ??
        'http://localhost:3000'

    const formRes = await fetch(
        `${base}/api/forms/${formId}`,
        {
            cache: 'no-store',
        },
    )

    if (!formRes.ok) return null

    const form: FormTemplate =
        (await formRes.json()).data

    if (!form.latestVersion) {
        return {
            form,
            version: null,
            submissions: [],
        }
    }

    const submissionsRes = await fetch(
        `${base}/api/forms/version/${form.latestVersion.id}/submissions`,
        {
            cache: 'no-store',
        },
    )

    const submissions: Submission[] =
        submissionsRes.ok
            ? (await submissionsRes.json()).data
            : []

    return {
        form,
        version: form.latestVersion,
        submissions,
    }
}

export default async function SubmissionsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const data = await getData(id)

    if (!data) notFound()

    const {
        form,
        version,
        submissions,
    } = data

    return (
        <main className="mx-auto max-w-7xl px-6 py-10">
            <header className="border-b border-black/10 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Submissions
                        </p>

                        <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-[0.08em] md:text-4xl">
                            {form.name}
                        </h1>

                        {version && (
                            <p className="mt-3 text-sm text-neutral-600">
                                Version {version.versionNumber}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="/"
                            className="border border-black/10 px-4 py-3 text-sm font-medium transition hover:border-black"
                        >
                            Home
                        </Link>

                        <Link
                            href={`/forms/${form.id}/fill` as Route}
                            className="border border-black/10 px-4 py-3 text-sm font-medium transition hover:border-black"
                        >
                            View Form
                        </Link>
                    </div>
                </div>
            </header>

            {!version ? (
                <div className="mt-8 border border-black/10 bg-white p-8 text-center">
                    <p className="text-neutral-600">
                        This form has no published version.
                    </p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="mt-8 border border-black/10 bg-white p-8 text-center">
                    <p className="text-neutral-600">
                        No submissions yet.
                    </p>
                </div>
            ) : (
                <div className="mt-8 space-y-4">
                    {submissions.map(submission => (
                        <article
                            key={submission.id}
                            className="border border-black/10 bg-white p-6"
                        >
                            <div className="mb-6 flex flex-col gap-2 border-b border-black/10 pb-4 md:flex-row md:items-center md:justify-between">
                                <span className="w-fit border border-black/10 px-2 py-1 font-mono text-xs">
                                    {submission.id.slice(-8)}
                                </span>

                                <span className="text-xs text-neutral-500">
                                    {new Date(
                                        submission.createdAt,
                                    ).toLocaleString()}
                                </span>
                            </div>

                            <dl className="space-y-3">
                                {Object.entries(
                                    submission.payload,
                                ).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="grid gap-1 md:grid-cols-[180px_1fr]"
                                    >
                                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                                            {key}
                                        </dt>

                                        <dd className="break-words text-sm">
                                            {String(value)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </article>
                    ))}
                </div>
            )}
        </main>
    )
}