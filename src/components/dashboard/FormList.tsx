// ─────────────────────────────────────────────────────────────────────────────
// components/dashboard/FormList.tsx
// Renders a <ul> so that each <FormCard> child (which returns <li>) is valid.
// Shows an empty state when the API returns no forms.
// ─────────────────────────────────────────────────────────────────────────────

import type { FormTemplate } from '@/types/form'
import { FormCard } from './FormCard'

interface FormListProps { forms: FormTemplate[] }

export function FormList({ forms }: FormListProps) {
    if (forms.length === 0) {
        return (
            <p className="border border-black/10 bg-white px-5 py-8 text-sm text-neutral-500">
                No forms yet. Create your first one above.
            </p>
        )
    }

    // Must be <ul> because FormCard returns <li>
    return (
        <ul className="space-y-3">
            {forms.map(form => (
                <FormCard key={form.id} form={form} />
            ))}
        </ul>
    )
}