import Link from 'next/link'
import type { Route } from 'next'

interface FormTemplate {
  id: string
  name: string
  createdAt: string
  versions: {
    id: string
    versionNumber: number
  }[]
}

async function getForms(): Promise<FormTemplate[]> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    'http://localhost:3000'

  const res = await fetch(
    `${base}/api/forms`,
    {
      cache: 'no-store',
    },
  )

  if (!res.ok) return []

  return (await res.json()).data
}

export default async function FormsPage() {
  const forms = await getForms()

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="border-b border-black/10 pb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Forms
            </p>

            <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-[0.08em] md:text-4xl">
              Form Library
            </h1>
          </div>

          <Link
            href="/forms/new"
            className="bg-black px-4 py-3 text-sm font-semibold text-white"
          >
            + New Form
          </Link>
        </div>
      </header>

      {forms.length === 0 ? (
        <div className="border border-black/10 bg-white p-8 text-center mt-8">
          <p className="text-neutral-600">
            No forms yet.
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Create one or run{' '}
            <code className="border border-black/10 px-2 py-1 font-mono text-xs">
              npm run db:seed
            </code>
          </p>

          <Link
            href="/forms/new"
            className="mt-6 inline-block bg-black px-4 py-3 text-sm font-semibold text-white"
          >
            Create Form
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {forms.map(form => {
            const latest = form.versions[0]

            return (
              <li
                key={form.id}
                className="border border-black/10 bg-white p-5 transition hover:border-black"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Form
                    </p>

                    <h2 className="mt-2 text-base font-semibold">
                      {form.name}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-600">
                      {latest
                        ? `v${latest.versionNumber}`
                        : 'No versions'}
                      {' · '}
                      {new Date(
                        form.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {latest && (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/forms/${latest.id}` as Route}
                        className="bg-black px-4 py-2 text-sm font-semibold text-white"
                      >
                        Fill Form
                      </Link>

                      <Link
                        href={`/forms/${latest.id}/submissions` as Route}
                        className="border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black"
                      >
                        Submissions
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}