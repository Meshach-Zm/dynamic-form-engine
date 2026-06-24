import { prisma } from '@/lib/prisma'
import type { FormTemplate } from '@/types/form'

export async function getForms(): Promise<FormTemplate[]> {
    const rows = await prisma.formTemplate.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            versions: {
                where: { isLatest: true },
                take: 1,
                include: {
                    _count: { select: { submissions: true } },
                },
            },
        },
    })

    return rows.map(row => {
        const latest = row.versions[0] ?? null
        return {
            id: row.id,
            name: row.name,
            status: (latest?.isLatest ? 'live' : 'draft') as 'live' | 'draft',
            latestVersion: latest
                ? {
                    id: latest.id,
                    versionNumber: latest.versionNumber,
                    isLatest: latest.isLatest,
                    createdAt: latest.createdAt.toISOString(),
                }
                : null,
            submissionCount: latest?._count.submissions ?? 0,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        }
    })
}