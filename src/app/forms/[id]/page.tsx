'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface FormVersionSummary {
    id: string
    versionNumber: number
}

interface FormTemplate {
    id: string
    name: string
    latestVersion: {
        id: string
        versionNumber: number
        schema: Record<string, unknown>
    } | null
    versions?: FormVersionSummary[]
}

export default function FormDetailsPage() {
    const params = useParams<{ id: string }>()

    const [form, setForm] = useState<FormTemplate | null>(null)
    const [schema, setSchema] = useState('')
    const [loading, setLoading] = useState(true)
    const [publishing, setPublishing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [versionsExpanded, setVersionsExpanded] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(
                    `/api/forms/${params.id}`,
                    { cache: 'no-store' },
                )

                if (!res.ok) {
                    throw new Error()
                }

                const json = await res.json()

                setForm(json.data)

                if (json.data.latestVersion) {
                    setSchema(
                        JSON.stringify(
                            json.data.latestVersion.schema,
                            null,
                            2,
                        ),
                    )
                }
            } catch {
                setError('Failed to load form.')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [params.id])

    async function publishVersion() {
        setError('')
        setSuccess('')

        let parsedSchema

        try {
            parsedSchema = JSON.parse(schema)
        } catch {
            setError('Schema is not valid JSON.')
            return
        }

        try {
            setPublishing(true)

            const res = await fetch(
                `/api/forms/${params.id}/versions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify({
                        schema: parsedSchema,
                    }),
                },
            )

            const json = await res.json()

            if (!res.ok) {
                setError(
                    json.error ??
                    'Failed to publish version.',
                )
                return
            }

            setSuccess(
                `Published version v${json.data.versionNumber}`,
            )

            location.reload()
        } catch {
            setError('Network error.')
        } finally {
            setPublishing(false)
        }
    }

    if (loading) {
        return (
            <main className="mx-auto max-w-5xl px-6 py-10">
                Loading...
            </main>
        )
    }

    if (!form) {
        return (
            <main className="mx-auto max-w-5xl px-6 py-10">
                Form not found.
            </main>
        )
    }

    const previousVersions = (form.versions ?? [])
        .filter(v => v.id !== form.latestVersion?.id)
        .sort((a, b) => b.versionNumber - a.versionNumber)

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <header className="border-b border-black/10 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Form Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.08em]">
                            {form.name}
                        </h1>

                        <p className="mt-3 text-sm text-neutral-600">
                            {form.latestVersion
                                ? `Current Version: v${form.latestVersion.versionNumber}`
                                : 'No versions published'}
                        </p>

                        {previousVersions.length > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setVersionsExpanded(
                                        prev => !prev,
                                    )
                                }
                                className="mt-2 flex items-center gap-1 text-sm font-medium text-neutral-600 underline-offset-2 hover:text-black hover:underline"
                                aria-expanded={versionsExpanded}
                            >
                                <span
                                    className={`inline-block transition-transform ${versionsExpanded ? 'rotate-90' : ''}`}
                                >
                                    ›
                                </span>
                                {versionsExpanded
                                    ? 'Hide previous versions'
                                    : `View previous versions (${previousVersions.length})`}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/"
                            className="border border-black/10 px-4 py-3 text-sm font-medium transition hover:border-black"
                        >
                            Home
                        </Link>

                        <Link
                            href={`/forms/${form.id}/fill`}
                            className="bg-black px-4 py-3 text-sm font-semibold text-white"
                        >
                            Fill Form
                        </Link>

                        <Link
                            href={`/forms/${form.id}/submissions`}
                            className="border border-black/10 px-4 py-3 text-sm font-medium"
                        >
                            Submissions
                        </Link>
                    </div>
                </div>

                {versionsExpanded && previousVersions.length > 0 && (
                    <div className="mt-6 border-t border-black/10 pt-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Previous Versions
                        </p>

                        <ul className="mt-3 space-y-2">
                            {previousVersions.map(version => (
                                <li
                                    key={version.id}
                                    className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 px-4 py-3"
                                >
                                    <span className="text-sm font-medium text-neutral-700">
                                        v{version.versionNumber}
                                    </span>

                                    <Link
                                        href={`/forms/${version.id}?mode=view`}
                                        className="border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:border-black"
                                    >
                                        View
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </header>

            <section className="mt-8">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        Publish New Version
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                        Editing this schema creates a
                        completely new version.
                        Existing submissions remain
                        attached to their original
                        version.
                    </p>
                </div>

                <textarea
                    value={schema}
                    onChange={e =>
                        setSchema(e.target.value)
                    }
                    rows={24}
                    spellCheck={false}
                    className="w-full border border-black/10 p-4 font-mono text-sm"
                />

                {error && (
                    <div className="mt-4 border border-red-300 bg-red-50 p-3 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 border border-green-300 bg-green-50 p-3 text-sm">
                        {success}
                    </div>
                )}

                <button
                    onClick={publishVersion}
                    disabled={publishing}
                    className="mt-6 bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {publishing
                        ? 'Publishing...'
                        : 'Publish New Version'}
                </button>
            </section>
        </main>
    )
}