'use client';

export const dynamic = 'force-dynamic';



import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { formatDateTime } from '@/lib/date';

interface Submission {
    id: string;
    payload: any;
    files?: any;
    createdAt: string;
}

interface VersionDetail {
    id: string;
    versionNumber: number;
    schema: any;
    createdAt: string;
    isLatest: boolean;
    submissions: Submission[];
}

export default function VersionDetailPage() {
    const params = useParams<{ id: string; versionId: string }>();
    const formId = params.id;
    const versionId = params.versionId;

    const [version, setVersion] = useState<VersionDetail | null>(null);
    const [formName, setFormName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSchema, setShowSchema] = useState(false);

    useEffect(() => {
        async function fetchVersion() {
            try {
                const response = await fetch(
                    `/api/forms/${formId}/versions/${versionId}`
                );
                const result = await response.json();

                if (result.data) {
                    setVersion(result.data.version);
                    setFormName(result.data.formName);
                } else {
                    setError(result.error || 'Version not found');
                }
            } catch (err) {
                setError('Failed to load version');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchVersion();
    }, [formId, versionId]);

    if (loading) return <LoadingPage />;

    if (error || !version) {
        return (
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="border border-red-200 bg-red-50 p-6 text-red-700">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error || 'Version not found'}</p>
                    <Link
                        href={`/forms/${formId}`}
                        className="mt-4 inline-block text-sm text-red-700 underline"
                    >
                        Back to form
                    </Link>
                </div>
            </main>
        );
    }

    const submissionCount = version.submissions?.length || 0;

    return (
        <main className="mx-auto max-w-6xl px-6 py-10">
            <Link
                href={`/forms/${formId}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
            >
                <span>Back</span> to {formName || 'Form'}
            </Link>

            <header className="mt-6 border-b border-black/10 pb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Version {version.versionNumber}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                            <span>{formName}</span>
                            <span className="text-neutral-300">•</span>
                            <span>Published {formatDateTime(version.createdAt)}</span>
                            {version.isLatest && (
                                <span className="bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                                    Latest
                                </span>
                            )}
                            <span className="text-neutral-300">•</span>
                            <span className="text-neutral-500">
                                {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <Link
                            href={`/forms/${formId}/fill?versionId=${version.id}`}
                            className="bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 inline-block"
                        >
                            Fill Form
                        </Link>
                        {!version.isLatest && (
                            <p className="text-xs text-neutral-400 mt-1">
                                Submitting to an older version
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setShowSchema(!showSchema)}
                    className="mt-4 text-sm font-medium text-neutral-500 hover:text-neutral-900"
                >
                    {showSchema ? 'Hide' : 'Show'} Schema
                </button>
                {showSchema && (
                    <div className="mt-4 overflow-auto border border-black/10 bg-neutral-900 p-4 max-h-96">
                        <pre className="text-sm text-neutral-300">
                            {JSON.stringify(version.schema, null, 2)}
                        </pre>
                    </div>
                )}
            </header>

            <section className="mt-8">
                <h2 className="text-lg font-medium mb-4">Submissions</h2>

                {submissionCount === 0 ? (
                    <div className="border border-black/10 bg-neutral-50 p-8 text-center">
                        <p className="text-sm text-neutral-500">
                            No submissions for this version yet
                        </p>
                        <Link
                            href={`/forms/${formId}/fill?versionId=${version.id}`}
                            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline"
                        >
                            Fill out this form
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {version.submissions?.map((submission) => (
                            <div
                                key={submission.id}
                                className="border border-black/10 p-4 transition hover:bg-neutral-50"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm text-neutral-500">
                                        {formatDateTime(submission.createdAt)}
                                    </span>
                                    <span className="text-xs text-neutral-400">
                                        ID: {submission.id.slice(0, 8)}
                                    </span>
                                </div>
                                <div className="overflow-auto bg-neutral-100 p-3">
                                    <pre className="text-sm">
                                        {JSON.stringify(submission.payload, null, 2)}
                                    </pre>
                                </div>
                                {submission.files && Object.keys(submission.files).length > 0 && (
                                    <div className="mt-3 border-t border-black/10 pt-3">
                                        <p className="text-xs font-medium text-neutral-500 mb-2">Attachments</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(submission.files).map(([key, file]: [string, any]) => {
                                                if (Array.isArray(file)) {
                                                    return file.map((f: any, index: number) => (
                                                        <div key={`${key}-${index}`} className="flex items-center gap-1">
                                                            <a
                                                                href={f.viewUrl || f.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs bg-neutral-100 px-2 py-1 rounded hover:bg-neutral-200 transition"
                                                            >
                                                                {f.fileName || f.name}
                                                            </a>
                                                            <a
                                                                href={f.downloadUrl || f.url}
                                                                download
                                                                className="text-xs text-neutral-400 hover:text-neutral-600"
                                                            >
                                                                Download
                                                            </a>
                                                        </div>
                                                    ));
                                                }
                                                return (
                                                    <div key={key} className="flex items-center gap-1">
                                                        <a
                                                            href={file.viewUrl || file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs bg-neutral-100 px-2 py-1 rounded hover:bg-neutral-200 transition"
                                                        >
                                                            {file.fileName || file.name}
                                                        </a>
                                                        <a
                                                            href={file.downloadUrl || file.url}
                                                            download
                                                            className="text-xs text-neutral-400 hover:text-neutral-600"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}