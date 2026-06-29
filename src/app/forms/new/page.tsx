'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ✅ REMOVED $schema
const STARTER_SCHEMA = JSON.stringify(
  {
    type: 'object',
    required: ['fullName', 'email'],
    additionalProperties: false,
    properties: {
      fullName: {
        type: 'string',
        minLength: 2,
        description: 'Full name'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address'
      },
    },
  },
  null,
  2,
)

export default function NewFormPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [schema, setSchema] = useState(STARTER_SCHEMA)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    let parsed
    try {
      parsed = JSON.parse(schema)
    } catch {
      setError('Schema is not valid JSON.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, schema: parsed }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed.'); return }
      router.push('/forms')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-black/10 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Form Builder
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-[0.08em] md:text-4xl">
          New Form
        </h1>
      </header>

      <section className="mt-8 border border-black/10 bg-white p-8">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
            >
              Form Name <span className="text-black">*</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Volunteer Registration"
              className="w-full border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="schema"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
            >
              JSON Schema <span className="text-black">*</span>
            </label>
            <textarea
              id="schema"
              rows={18}
              value={schema}
              onChange={e => setSchema(e.target.value)}
              spellCheck={false}
              className="min-h-[420px] w-full resize-y border border-black/10 px-4 py-3 font-mono text-sm outline-none transition focus:border-black"
            />
            <p className="mt-2 text-sm text-neutral-500">
              Fields render from{' '}
              <code className="border border-black/10 px-1 py-0.5 font-mono text-xs">properties</code>.
              Use{' '}
              <code className="border border-black/10 px-1 py-0.5 font-mono text-xs">description</code>{' '}
              as the label.
            </p>
          </div>

          {error && (
            <div className="border border-black px-4 py-3 text-sm">{error}</div>
          )}

          <div className="border-t border-black/10 pt-6">
            <button
              onClick={submit}
              disabled={loading || !name.trim()}
              className="bg-black px-8 py-4 text-sm font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              {loading ? 'Creating…' : 'Create Form'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}