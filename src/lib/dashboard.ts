// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/dashboard.ts
//
// computeStats and deriveActivity now operate on FormTemplate[] (versions[])
// instead of the old shape (status / latestVersion / submissionCount).
// ─────────────────────────────────────────────────────────────────────────────

import type {
    FormTemplate,
    DashboardStats,
    ActivityItem,
} from '@/types/form'

export function computeStats(forms: FormTemplate[]): DashboardStats {
    const allVersions = forms.flatMap(f => f.versions)

    return {
        totalForms: forms.length,
        // GET /api/forms does not include submission counts (no _count in the
        // repository query). Keep as 0 until the API adds it.
        totalSubmissions: 0,
        latestVersion:
            allVersions.length > 0
                ? Math.max(...allVersions.map(v => v.versionNumber))
                : 0,
    }
}

export function deriveActivity(forms: FormTemplate[]): ActivityItem[] {
    const items: ActivityItem[] = []

    for (const form of forms) {
        const sorted = [...form.versions].sort(
            (a, b) => a.versionNumber - b.versionNumber,
        )

        for (const version of sorted) {
            items.push({
                id: `v-${version.id}`,
                type:
                    version.versionNumber === 1
                        ? 'form_created'
                        : 'version_published',
                formName: form.name,
                versionNumber: version.versionNumber,
                timestamp: version.createdAt,
            })
        }
    }

    return items
        .sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
        )
        .slice(0, 10)
}