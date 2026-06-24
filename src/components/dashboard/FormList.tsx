import type { FormTemplate } from '@/types/form'
import { FormCard } from './FormCard'

interface Props { forms: FormTemplate[] }

export function FormList({ forms }: Props) {
    if (forms.length === 0) {
        return <p className="empty-state">No forms yet. Create your first one above.</p>
    }
    return (
        <div className="form-list">
            {forms.map(form => <FormCard key={form.id} form={form} />)}
        </div>
    )
}