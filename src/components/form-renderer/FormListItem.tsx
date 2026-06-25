'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'

interface FormVersion {
    id: string
    versionNumber: number
}

interface FormTemplate {
    id: string
    name: string
    createdAt: string
    versions: FormVersion[]
}

export default function FormListItem({ form }: { form: FormTemplate }) {
    const [expanded, setExpanded] = useState(false)

    const sortedVersions = [...form.versions].sort(
        (a, b) => b.versionNumber - a.versionNumber,
    )
    const latest = sortedVersions[0]
    const previousVersions = sortedVersions.slice(1)

    return (
        <li className="border border-black/10 bg-white p-5 transition hover:border-black">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Form
                    </p>

                    <h2 className="mt-2 text-base font-semibold">{form.name}</h2>

                    <p className="mt-1 text-sm text-neutral-600">
                        {latest
                            ? `Latest Version: v${latest.versionNumber}`
                            : 'No versions'}
                        {' · '}
                        {new Date(form.createdAt).toLocaleDateString()}
                    </p>

                    {previousVersions.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setExpanded(prev => !prev)}
                            className="mt-2 flex items-center gap-1 text-sm font-medium text-neutral-600 underline-offset-2 hover:text-black hover:underline"
                            aria-expanded={expanded}
                        >
                            <span
                                className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}
                            >
                                ›
                            </span>
                            {expanded
                                ? 'Hide previous versions'
                                : `View previous versions (${previousVersions.length})`}
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/forms/${form.id}` as Route}
                        className="border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black"
                    >
                        Manage
                    </Link>

                    {latest && (
                        <>
                            <Link
                                href={`/forms/${form.id}/fill` as Route}
                                className="bg-black px-4 py-2 text-sm font-semibold text-white"
                            >
                                Fill Form
                            </Link>

                            <Link
                                href={`/forms/${form.id}/submissions` as Route}
                                className="border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black"
                            >
                                Submissions
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {expanded && previousVersions.length > 0 && (
                <div className="mt-4 border-t border-black/10 pt-4">
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
                                    href={`/forms/${version.id}?mode=view` as Route}
                                    className="border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:border-black"
                                >
                                    View
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </li>
    )
}