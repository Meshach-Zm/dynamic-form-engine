import type { ActivityItem } from '@/types/form'

function relativeTime(timestamp: string): string {
    const mins = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 60_000,
    )

    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`

    const hrs = Math.floor(mins / 60)

    if (hrs < 24) return `${hrs}h ago`

    return `${Math.floor(hrs / 24)}d ago`
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const label = {
        submission: (
            <>
                New submission on <strong>{item.formName}</strong>{' '}
                <em>· v{item.versionNumber}</em>
            </>
        ),
        version_published: (
            <>
                New version published on{' '}
                <strong>{item.formName}</strong>{' '}
                <em>· v{item.versionNumber}</em>
            </>
        ),
        form_created: (
            <>
                <strong>{item.formName}</strong> created{' '}
                <em>· draft</em>
            </>
        ),
    }[item.type]

    return (
        <div className="grid gap-4 border-t border-black/10 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="text-sm">
                {label}
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                {relativeTime(item.timestamp)}
            </div>
        </div>
    )
}

interface Props {
    items: ActivityItem[]
}

export function ActivityFeed({ items }: Props) {
    return (
        <section className="border border-black/10 bg-white">
            <div className="border-b border-black/10 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Activity
                </p>

                <h2 className="mt-2 text-lg font-semibold">
                    Recent Activity
                </h2>
            </div>

            {items.map(item => (
                <ActivityRow
                    key={item.id}
                    item={item}
                />
            ))}
        </section>
    )
}