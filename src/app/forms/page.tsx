import { Suspense } from 'react';
import FormsList from './FormsList';

export default function FormsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <FormsList />
    </Suspense>
  );
}