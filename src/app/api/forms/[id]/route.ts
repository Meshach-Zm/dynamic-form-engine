import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    _req: NextRequest,
    { params }: RouteContext
) {
    const { id } = await params;

    try {
        const form = await prisma.formTemplate.findUnique({
            where: { id },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    include: {
                        _count: {
                            select: { submissions: true },
                        },
                    },
                },
            },
        });

        if (!form) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        const latestVersion = form.versions.find(v => v.isLatest);

        return NextResponse.json(
            {
                data: {
                    id: form.id,
                    name: form.name,
                    createdAt: form.createdAt.toISOString(),
                    updatedAt: form.updatedAt.toISOString(),
                    latestVersion: latestVersion ? {
                        id: latestVersion.id,
                        versionNumber: latestVersion.versionNumber,
                        schema: latestVersion.schema,
                        createdAt: latestVersion.createdAt.toISOString(),
                    } : null,
                    versions: form.versions.map(v => ({
                        id: v.id,
                        versionNumber: v.versionNumber,
                        isLatest: v.isLatest,
                        createdAt: v.createdAt.toISOString(),
                        _count: v._count,
                    })),
                },
            },
            {
                headers: {
                    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
                },
            }
        );
    } catch (error) {
        console.error('GET /api/forms/[id] failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}