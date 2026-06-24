import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page page--narrow" style={{ textAlign: 'center', paddingTop: '6rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--border)' }}>404</h1>
      <p style={{ color: 'var(--muted)', margin: '0.75rem 0 1.5rem' }}>Page not found.</p>
      <Link href="/forms" className="btn">Back to forms</Link>
    </main>
  )
}
