import { Suspense } from 'react';
import SubmissionsList from './SubmissionsList';

export default async function SubmissionsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // ✅ Await params before accessing its properties
    const { id } = await params;

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <SubmissionsList formId={id} />
        </Suspense>
    );
}