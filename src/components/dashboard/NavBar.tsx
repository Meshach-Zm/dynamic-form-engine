import Link from 'next/link'

export function NavBar() {
    return (
        <nav className="border-b border-black/10 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center border border-black/10">
                        <i className="ti ti-forms text-lg" aria-hidden="true" />
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Dynamic Form Engine
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={{ pathname: '/forms' }}
                        className="border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black"
                    >
                        Submissions
                    </Link>

                    <Link
                        href={{ pathname: '/forms/new' }}
                        className="bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        + New form
                    </Link>
                </div>
            </div>
        </nav>
    )
}