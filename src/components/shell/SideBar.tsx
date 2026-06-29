'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/', icon: 'ti-layout-dashboard', exact: true },
    { label: 'Forms', href: '/forms', icon: 'ti-files', exact: false },
] as const;

function NavItem({
    href,
    icon,
    label,
    exact,
}: {
    href: string;
    icon: string;
    label: string;
    exact: boolean;
}) {
    const pathname = usePathname();
    const active = exact ? pathname === href : pathname.startsWith(href);

    return (
        <li>
            <Link
                href={href as Route}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${active
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
            >
                <i
                    className={`ti ${icon} text-base`}
                    aria-hidden="true"
                />
                <span>{label}</span>
            </Link>
        </li>
    );
}

export function SideBar() {
    const pathname = usePathname();

    return (
        <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white">
                        <i className="ti ti-forms text-sm" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-neutral-800">
                            Form Engine
                        </p>
                        <p className="text-xs text-neutral-400">Dynamic Form Builder</p>
                    </div>
                </Link>
            </div>

            <div className="border-b border-neutral-200 px-3 py-4">
                <Link
                    href="/forms/new"
                    className="flex w-full items-center justify-center gap-2 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                    <i className="ti ti-plus text-base" aria-hidden="true" />
                    New Form
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5">
                <p className="mb-3 px-2 text-xs font-medium text-neutral-400">
                    Main Menu
                </p>
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                        <NavItem key={item.href} {...item} />
                    ))}
                </ul>
            </nav>

            <div className="border-t border-neutral-200 px-5 py-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">v1.0.0</span>
                </div>
            </div>
        </aside>
    );
}