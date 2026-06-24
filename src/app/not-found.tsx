import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Error
      </p>

      <h1 className="mt-4 text-7xl font-black tracking-tight text-black/10 md:text-8xl">
        404
      </h1>

      <p className="mt-4 text-neutral-600">
        Page not found.
      </p>

      <Link
        href="/forms"
        className="mt-8 bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Back to Forms
      </Link>
    </main>
  )
}