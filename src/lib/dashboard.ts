import type { FormTemplate, DashboardStats, ActivityItem } from '@/types/form'

export function computeStats(forms: FormTemplate[]): DashboardStats {
    return {
        activeForms: forms.filter(f => f.status === 'live').length,
        totalSubmissions: forms.reduce((sum, f) => sum + f.submissionCount, 0),
        latestVersion: Math.max(0, ...forms.map(f => f.latestVersion?.versionNumber ?? 0)),
    }
}

// Derives activity from the forms list until a dedicated /api/activity endpoint exists
export function deriveActivity(forms: FormTemplate[]): ActivityItem[] {
    return forms
        .flatMap((form): ActivityItem[] => {
            if (!form.latestVersion) return []
            return [{
                id: `v-${form.latestVersion.id}`,
                type: form.latestVersion.versionNumber === 1 ? 'form_created' : 'version_published',
                formName: form.name,
                versionNumber: form.latestVersion.versionNumber,
                isDraft: form.status === 'draft',
                timestamp: form.updatedAt,
            }]
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
}