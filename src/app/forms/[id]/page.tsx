'use client';

export const dynamic = 'force-dynamic';



import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '@/lib/date';

interface FormVersionSummary {
  id: string;
  versionNumber: number;
  isLatest: boolean;
  createdAt: string;
  _count?: {
    submissions: number;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  latestVersion: {
    id: string;
    versionNumber: number;
    schema: Record<string, unknown>;
    createdAt: string;
  } | null;
  versions?: FormVersionSummary[];
}

export default function FormDetailsPage() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [schema, setSchema] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/forms/${params.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setForm(json.data);
        if (json.data.latestVersion) {
          setSchema(JSON.stringify(json.data.latestVersion.schema, null, 2));
        }
      } catch {
        setError('Failed to load form.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function publishVersion() {
    setError('');
    setSuccess('');
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(schema);
    } catch {
      setError('Schema is not valid JSON.');
      return;
    }
    try {
      setPublishing(true);
      const res = await fetch(`/api/forms/${params.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: parsedSchema }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to publish.'); return; }
      setSuccess(`Published v${json.data.versionNumber}`);
      setTimeout(() => location.reload(), 1500);
    } catch {
      setError('Network error.');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <LoadingPage />;
  if (!form) return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-center text-neutral-500">Form not found.</div>
    </main>
  );

  const previousVersions = (form.versions ?? [])
    .filter(v => !v.isLatest)
    .sort((a, b) => b.versionNumber - a.versionNumber);

  const latestVersion = form.latestVersion;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-black/10 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Form Management
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {form.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              {latestVersion ? (
                <>
                  <span>Current version: v{latestVersion.versionNumber}</span>
                  <span className="text-neutral-300">•</span>
                  <span>Published {timeAgo(latestVersion.createdAt)}</span>
                </>
              ) : (
                <span>No versions published</span>
              )}
            </div>
          </div>
          {latestVersion && (
            <Link
              href={`/forms/${params.id}/fill`}
              className="bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Fill Form
            </Link>
          )}
        </div>

        {previousVersions.length > 0 && (
          <details className="mt-4 border border-black/10 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900">
              Previous versions ({previousVersions.length})
            </summary>
            <ul className="divide-y divide-black/5 border-t border-black/10">
              {previousVersions.map((version) => (
                <li
                  key={version.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-700">
                      v{version.versionNumber}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {formatDate(version.createdAt)}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {version._count?.submissions || 0} submissions
                    </span>
                  </div>
                  <Link
                    href={`/forms/${params.id}/versions/${version.id}`}
                    className="border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:border-neutral-900"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium mb-1">Publish New Version</h2>
        <p className="text-sm text-neutral-500">
          Editing this schema creates a new version. Existing submissions remain
          attached to their original version.
        </p>

        <textarea
          value={schema}
          onChange={e => setSchema(e.target.value)}
          rows={24}
          spellCheck={false}
          className="mt-4 w-full border border-black/10 p-4 font-mono text-sm outline-none transition focus:border-neutral-900"
        />

        {error && (
          <div className="mt-4 border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 border border-black/10 bg-neutral-900 px-4 py-3 text-sm text-white">
            {success}
          </div>
        )}

        <button
          onClick={publishVersion}
          disabled={publishing}
          className="mt-6 bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {publishing ? 'Publishing...' : 'Publish New Version'}
        </button>
      </section>
    </main>
  );
