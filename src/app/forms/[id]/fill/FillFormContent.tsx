'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import FormRenderer from '@/components/form-renderer/FormRenderer';

export default function FillFormContent({ formId }: { formId: string }) {
    const searchParams = useSearchParams();
    const versionId = searchParams.get('versionId');

    const [form, setForm] = useState<any>(null);
    const [version, setVersion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchForm() {
            try {
                const formResponse = await fetch(`/api/forms/${formId}`);
                const formResult = await formResponse.json();

                if (!formResult.data) {
                    setError('Form not found');
                    return;
                }
                setForm(formResult.data);

                if (versionId) {
                    const versionResponse = await fetch(`/api/forms/${formId}/versions/${versionId}`);
                    const versionResult = await versionResponse.json();

                    if (versionResult.data) {
                        setVersion(versionResult.data.version);
                    } else {
                        setError('Version not found');
                    }
                } else {
                    const latest = formResult.data.latestVersion;
                    if (latest) {
                        setVersion(latest);
                    } else {
                        setError('No published version of this form');
                    }
                }
            } catch (err) {
                setError('Failed to load form');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchForm();
    }, [formId, versionId]);

    if (loading) return <LoadingPage />;

    if (error || !version) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-10">
                <div className="border border-red-200 bg-red-50 p-6 text-red-700">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error || 'Form not available'}</p>
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

    const versionLabel = versionId ? `Version ${version.versionNumber}` : 'Latest Version';

    return (
        <main className="mx-auto max-w-3xl px-6 py-10">
            <Link
                href={`/forms/${formId}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
            >
                <span>Back</span> to {form?.name || 'Form'}
            </Link>

            <div className="mt-4">
                <p className="text-sm text-neutral-500 mb-2">{versionLabel}</p>
                <FormRenderer
                    schema={version.schema}
                    formVersionId={version.id}
                    formName={form?.name || 'Form'}
                    formId={formId}
                />
            </div>
        </main>
    );
}