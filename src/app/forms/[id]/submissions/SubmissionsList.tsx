'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTime } from '@/lib/date';

export default function SubmissionsList({ formId }: { formId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1');

    const [form, setForm] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const formResponse = await fetch(`/api/forms/${formId}`);
                const formResult = await formResponse.json();
                if (!formResult.data) {
                    setError('Form not found');
                    return;
                }
                setForm(formResult.data);

                const subResponse = await fetch(
                    `/api/forms/${formId}/submissions?page=${currentPage}&limit=10`
                );
                const subResult = await subResponse.json();

                if (subResult.data) {
                    setSubmissions(subResult.data);
                    setPagination(subResult.pagination);
                }
            } catch (err) {
                setError('Failed to load submissions');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [formId, currentPage]);

    const handlePageChange = (page: number) => {
        router.push(`/forms/${formId}/submissions?page=${page}`);
    };

    if (loading) return <LoadingPage />;

    if (error || !form) {
        return (
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="border border-red-200 bg-red-50 p-6 text-red-700">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error || 'Form not found'}</p>
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

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <div className="mb-6">
                <Link
                    href={`/forms/${formId}`}
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
                >
                    <span>Back</span> to {form?.name || 'Form'}
                </Link>
                <h1 className="text-2xl font-bold mt-4">All Submissions</h1>
                <p className="text-sm text-neutral-500">
                    {pagination?.total || 0} total submissions
                </p>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 border border-black/10">
                    <p className="text-neutral-500">No submissions yet</p>
                    <Link
                        href={`/forms/${formId}/fill`}
                        className="text-neutral-900 underline text-sm mt-2 inline-block"
                    >
                        Fill out this form →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {submissions.map((submission: any) => (
                            <div key={submission.id} className="border border-black/10 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-neutral-500">
                                            {formatDateTime(submission.createdAt)}
                                        </span>
                                        <span className="text-xs bg-neutral-100 px-2 py-0.5">
                                            v{submission.version.versionNumber}
                                            {submission.version.isLatest && ' (Latest)'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-neutral-400">
                                        ID: {submission.id.slice(0, 8)}
                                    </span>
                                </div>
                                <div className="bg-neutral-50 p-3 overflow-auto">
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
                                                                className="text-xs bg-neutral-100 px-2 py-1 hover:bg-neutral-200 transition"
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
                                                            className="text-xs bg-neutral-100 px-2 py-1 hover:bg-neutral-200 transition"
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

                    {pagination && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            hasNext={pagination.hasNext}
                            hasPrev={pagination.hasPrev}
                            onPageChangeAction={handlePageChange}
                        />
                    )}
                </>
            )}
        </main>
    );
}