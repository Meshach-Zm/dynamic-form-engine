'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/date';

interface Form {
  id: string;
  name: string;
  createdAt: string;
  versions: any[];
  user?: {
    name: string;
    email: string;
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

export default function FormsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [forms, setForms] = useState<Form[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      try {
        const response = await fetch(`/api/forms?page=${currentPage}&limit=10`);
        const result = await response.json();

        if (result.data) {
          setForms(result.data);
          setPagination(result.pagination);
        } else {
          setError(result.error || 'Failed to load forms');
        }
      } catch (err) {
        setError('Network error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchForms();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    router.push(`/forms?page=${page}`);
  };

  if (loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="border-b border-black/10 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Form Management
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.08em]">
              All Forms
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {pagination?.total || 0} form{(pagination?.total || 0) !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link
            href="/forms/new"
            className="bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            + New Form
          </Link>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="mt-12 text-center text-neutral-500">
          <p>No forms found</p>
          <Link
            href="/forms/new"
            className="mt-3 inline-block text-sm font-medium text-black underline"
          >
            Create your first form →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/forms/${form.id}`}
                className="block border border-black/10 p-6 transition hover:border-black hover:shadow-sm"
              >
                <h2 className="text-xl font-bold">{form.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                  <span>{form.versions.length} version{form.versions.length !== 1 ? 's' : ''}</span>
                  <span className="text-neutral-300">•</span>
                  <span>Created {formatDate(form.createdAt)}</span>
                  {form.user && (
                    <>
                      <span className="text-neutral-300">•</span>
                      <span className="text-xs text-neutral-400">
                        by {form.user.name || form.user.email}
                      </span>
                    </>
                  )}
                </div>
              </Link>
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
    </div>
  );
}export const dynamic = 'force-dynamic';
