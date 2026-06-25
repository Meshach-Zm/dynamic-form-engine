import Link from 'next/link'

export function HeroSection() {
    return (
        <section className="relative overflow-hidden border-b border-black/10 bg-[#FDFAF4]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12%] top-[-20%] h-64 w-64 bg-[#ffd6c8]/70 blur-3xl" />
                <div className="absolute right-[-10%] top-[10%] h-72 w-72 bg-[#dff7c8]/70 blur-3xl" />
                <div className="absolute left-[30%] top-[15%] h-80 w-80 bg-[#eef0a8]/40 blur-3xl" />
                <div className="absolute bottom-[-25%] left-[10%] h-96 w-96 bg-[#b9d8ff]/70 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Dynamic · Schema-Driven
                </p>

                <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[0.08em] md:text-6xl">
                    Your Forms,
                    <br />
                    Any Shape.
                </h1>

                <p className="mt-8 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base">
                    Define once, validate automatically. Fields and rules
                    live in configuration instead of your application code.
                </p>

                <div className="mt-10 flex flex-wrap gap-3">
                    <Link
                        href="/forms/new"
                        className="bg-black px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        Create a form →
                    </Link>

                    <Link
                        href={{ pathname: '/forms' }}
                        className="border border-black/10 bg-white px-8 py-4 text-sm font-semibold transition hover:border-black"
                    >
                        View submissions
                    </Link>
                </div>
            </div>
        </section>
    )
}