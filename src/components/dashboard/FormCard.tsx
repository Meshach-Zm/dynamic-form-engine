import Link from 'next/link'
import type { Route } from 'next'
import type { FormTemplate } from '@/types/form'

const ICON_MAP: Record<string, string> = {
    contact: 'ti-user',
    volunteer: 'ti-clipboard-list',
    default: 'ti-file-text',
}

function resolveIcon(name: string): string {
    const lower = name.toLowerCase()

    return Object.keys(ICON_MAP).find(
        k => k !== 'default' && lower.includes(k),
    )
        ? ICON_MAP[
        Object.keys(ICON_MAP).find(k => lower.includes(k))!
        ]
        : ICON_MAP.default
}

interface Props {
    form: FormTemplate
}

export function FormCard({ form }: Props) {
    const isLive = form.status === 'live'
    const version = form.latestVersion?.versionNumber ?? 1

    return (
        <li className="border border-black/10 bg-white p-5 transition hover:border-black">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 place-items-center border border-black/10">
                        <i
                            className={`ti ${resolveIcon(form.name)}`}
                            aria-hidden="true"
                        />
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Form
                        </p>

                        <h3 className="mt-2 text-base font-semibold">
                            {form.name}
                        </h3>

                        <p className="mt-1 text-sm text-neutral-600">
                            v{version} · {form.submissionCount} submissions
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]
                        ${isLive
                                ? 'border-black/10 bg-black text-white'
                                : 'border-black/10 bg-white text-neutral-600'
                            }`}
                    >
                        {isLive ? 'Live' : 'Draft'}
                    </span>

                    <Link
                        href={`/forms/${form.id}/fill` as Route}
                        className="border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black"
                    >
                        Fill form
                    </Link>

                    <Link
                        href={`/forms/${form.id}/submissions` as Route}
                        className="border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black"
                    >
                        Submissions
                    </Link>
                </div>
            </div>
        </li>
    )
}