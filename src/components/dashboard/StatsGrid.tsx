import type { DashboardStats } from '@/types/form'

interface Props {
    stats: DashboardStats
}

export function StatsGrid({ stats }: Props) {
    const cards = [
        {
            label: 'Active forms',
            value: stats.activeForms,
        },
        {
            label: 'Total submissions',
            value: stats.totalSubmissions,
        },
        {
            label: 'Latest version',
            value: `v${stats.latestVersion}`,
        },
    ]

    return (
        <section className="mt-10">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Overview
            </p>

            <div className="grid gap-px border border-black/10 bg-black/10 md:grid-cols-3">
                {cards.map(card => (
                    <div
                        key={card.label}
                        className="bg-white p-8"
                    >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            {card.label}
                        </p>

                        <div className="mt-4 text-4xl font-black tracking-tight">
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}