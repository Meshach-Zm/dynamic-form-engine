import type {
    FormTemplate,
    DashboardStats,
    ActivityItem,
} from '@/types/form'

export function computeStats(
    forms: FormTemplate[],
): DashboardStats {
    return {
        activeForms: forms.filter(
            f => f.status === 'live',
        ).length,

        totalSubmissions: forms.reduce(
            (sum, f) => sum + f.submissionCount,
            0,
        ),

        latestVersion: Math.max(
            0,
            ...forms.map(
                f =>
                    f.latestVersion?.versionNumber ??
                    0,
            ),
        ),
    }
}

export function deriveActivity(
    forms: FormTemplate[],
): ActivityItem[] {
    return forms
        .flatMap((form): ActivityItem[] => {
            if (!form.latestVersion) return []

            const type: ActivityItem['type'] =
                form.latestVersion.versionNumber === 1
                    ? 'form_created'
                    : 'version_published'

            return [
                {
                    id: `v-${form.latestVersion.id}`,
                    type,
                    formName: form.name,
                    versionNumber:
                        form.latestVersion.versionNumber,
                    isDraft:
                        form.status === 'draft',
                    timestamp: form.updatedAt,
                },
            ]
        })
        .sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
        )
        .slice(0, 5)
}