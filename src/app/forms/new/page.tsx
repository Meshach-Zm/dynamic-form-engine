'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STARTER_SCHEMA = JSON.stringify(
  {
    type: 'object',
    required: ['fullName', 'email'],
    additionalProperties: false,
    properties: {
      fullName: { type: 'string', minLength: 2, description: 'Full name' },
      email:    { type: 'string', format: 'email', description: 'Email address' },
    },
  },
  null,
  2
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
    <main className="page page--narrow">
      <div className="page-header">
        <h1>New form</h1>
        <a href="/forms" className="btn btn--ghost btn--sm">Cancel</a>
      </div>

      <div className="form-wrap">
        <div className="field">
          <label className="label" htmlFor="name">Form name <span className="required">*</span></label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Volunteer Registration"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="schema">JSON Schema <span className="required">*</span></label>
          <textarea
            id="schema"
            className="input input--textarea input--mono"
            rows={16}
            value={schema}
            onChange={e => setSchema(e.target.value)}
            spellCheck={false}
          />
          <span className="hint">
            Fields render from <code>properties</code>. Use <code>description</code> as the label.
          </span>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <button className="btn" onClick={submit} disabled={loading || !name.trim()}>
          {loading ? 'Creating…' : 'Create form'}
        </button>
      </div>
    </main>
  )
}
