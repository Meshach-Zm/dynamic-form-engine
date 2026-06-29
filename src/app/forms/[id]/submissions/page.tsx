'use client';

export const dynamic = 'force-dynamic';



import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTime } from '@/lib/date';

interface Submission {
    id: string;
    payload: any;
    files?: any;
    createdAt: string;
    version: {
        versionNumber: number;
        isLatest: boolean;
    };
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function SubmissionsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = params.id;
    const currentPage = parseInt(searchParams.get('page') || '1');

    const [form, setForm] = useState<any>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                // Get form details
                const formResponse = await fetch(`/api/forms/${formId}`);
                const formResult = await formResponse.json();

                if (!formResult.data) {
                    setError('Form not found');
                    return;
                }
                setForm(formResult.data);

                // Get all submissions with pagination
                const versionsResponse = await fetch(`/api/forms/${formId}/versions`);
                const versionsResult = await versionsResponse.json();

                if (!versionsResult.data || versionsResult.data.length === 0) {
                    setSubmissions([]);
                    setLoading(false);
                    return;
                }

                // Get submissions for each version with pagination
                const allSubmissions: Submission[] = [];
                let totalItems = 0;
                let totalPages = 0;
                let currentPageNum = currentPage;
                let hasNext = false;
                let hasPrev = false;

                for (const version of versionsResult.data) {
                    const subResponse = await fetch(
                        `/api/forms/${formId}/versions/${version.id}/submissions?page=${currentPage}&limit=10`
                    );
                    const subResult = await subResponse.json();

                    if (subResult.data) {
                        allSubmissions.push(
                            ...subResult.data.map((s: any) => ({
                                ...s,
                                version: {
                                    versionNumber: version.versionNumber,
                                    isLatest: version.isLatest,
                                },
                            }))
                        );
                    }

                    if (subResult.pagination) {
                        totalItems += subResult.pagination.total;
                        totalPages = Math.max(totalPages, subResult.pagination.totalPages);
                        currentPageNum = subResult.pagination.page;
                        hasNext = subResult.pagination.hasNext || hasNext;
                        hasPrev = subResult.pagination.hasPrev || hasPrev;
                    }
                }

                // Sort by newest first
                allSubmissions.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Apply pagination limit across all
                const start = (currentPage - 1) * 10;
                const end = start + 10;
                const paginatedSubmissions = allSubmissions.slice(start, end);

                setSubmissions(paginatedSubmissions);
                setPagination({
                    page: currentPageNum,
                    limit: 10,
                    total: totalItems,
                    totalPages: Math.ceil(totalItems / 10) || 1,
                    hasNext: paginatedSubmissions.length === 10 && allSubmissions.length > end,
                    hasPrev: currentPage > 1,
                });
            } catch (err) {
                setError('Failed to load submissions');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchSubmissions();
    }, [formId, currentPage]);

    const handlePageChange = (page: number) => {
        router.push(`/forms/${formId}/submissions?page=${page}`);
    };

    if (loading) return <LoadingPage />;

    if (error) {
        return (
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="border border-red-200 bg-red-50 p-6 text-red-700">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                    <Link
                        href={`/forms/${formId}`}
                        className="mt-4 inline-block text-sm text-red-700 underline"
                    >
                        ← Back to form
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
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black"
                >
                    <span>←</span> Back to {form?.name || 'Form'}
                </Link>
                <h1 className="text-2xl font-bold mt-4">All Submissions</h1>
                <p className="text-sm text-neutral-500">
                    {pagination?.total || 0} total submissions
                </p>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-black/10">
                    <p className="text-neutral-500">No submissions yet</p>
                    <Link
                        href={`/forms/${formId}/fill`}
                        className="text-black underline text-sm mt-2 inline-block"
                    >
                        Fill out this form →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {submissions.map((submission) => (
                            <div key={submission.id} className="border border-black/10 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-neutral-500">
                                            {formatDateTime(submission.createdAt)}
                                        </span>
                                        <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">
                                            v{submission.version.versionNumber}
                                            {submission.version.isLatest && ' (Latest)'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-neutral-400">
                                        ID: {submission.id.slice(0, 8)}
                                    </span>
                                </div>

                                {/* Payload */}
                                <div className="bg-neutral-50 p-3 rounded overflow-auto mb-3">
                                    <pre className="text-sm">
                                        {JSON.stringify(submission.payload, null, 2)}
                                    </pre>
                                </div>

                                {/* ✅ Files Section */}
                                {submission.files && Object.keys(submission.files).length > 0 && (
                                    <div className="border-t border-black/10 pt-3 mt-2">
                                        <p className="text-xs font-medium text-neutral-500 mb-2">📎 Attachments</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(submission.files).map(([key, file]: [string, any]) => {
                                                // Handle array of files (like verificationDocs)
                                                if (Array.isArray(file)) {
                                                    return file.map((f: any, index: number) => (
                                                        <div key={`${key}-${index}`} className="flex items-center gap-1">
                                                            {/* View link - opens in browser */}
                                                            <a
                                                                href={f.viewUrl || f.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs bg-neutral-100 px-2 py-1 rounded hover:bg-neutral-200 transition"
                                                            >
                                                                {f.type?.startsWith('image/') ? '🖼️' : f.type === 'application/pdf' ? '📄' : '📎'}
                                                                {f.fileName || f.name}
                                                            </a>
                                                            {/* Download link */}
                                                            <a
                                                                href={f.downloadUrl || f.url}
                                                                download
                                                                className="text-xs text-neutral-400 hover:text-neutral-600"
                                                                title="Download"
                                                            >
                                                                ⬇️
                                                            </a>
                                                        </div>
                                                    ));
                                                }

                                                // Handle single file (like profilePicture)
                                                return (
                                                    <div key={key} className="flex items-center gap-1">
                                                        <a
                                                            href={file.viewUrl || file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs bg-neutral-100 px-2 py-1 rounded hover:bg-neutral-200 transition"
                                                        >
                                                            {file.type?.startsWith('image/') ? '🖼️' : file.type === 'application/pdf' ? '📄' : '📎'}
                                                            {file.fileName || file.name}
                                                        </a>
                                                        <a
                                                            href={file.downloadUrl || file.url}
                                                            download
                                                            className="text-xs text-neutral-400 hover:text-neutral-600"
                                                            title="Download"
                                                        >
                                                            ⬇️
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