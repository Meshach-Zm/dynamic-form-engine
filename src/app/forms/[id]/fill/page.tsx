import { Suspense } from 'react';
import FillFormContent from './FillFormContent';

export default async function FillFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <FillFormContent formId={id} />
    </Suspense>
  );
}