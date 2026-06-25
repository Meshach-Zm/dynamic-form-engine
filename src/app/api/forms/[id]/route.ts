import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const form = await prisma.formTemplate.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        if (!form) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            )
        }

        const [latestVersion, versions] = await Promise.all([
            prisma.formVersion.findFirst({
                where: { formTemplateId: id, isLatest: true },
                select: {
                    id: true,
                    versionNumber: true,
                    schema: true,
                    createdAt: true,
                    isLatest: true,
                },
            }),
            prisma.formVersion.findMany({
                where: { formTemplateId: id },
                select: {
                    id: true,
                    versionNumber: true,
                },
                orderBy: {
                    versionNumber: 'desc',
                },
            }),
        ])

        return NextResponse.json({
            data: {
                id: form.id,
                name: form.name,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt,
                latestVersion: latestVersion ?? versions[0] ?? null,
                versions,
            },
        })
    } catch (err) {
        console.error('GET /api/forms/[id] failed:', err)

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}