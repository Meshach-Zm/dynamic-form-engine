import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string; versionId: string }>;
};

export async function GET(
    _req: NextRequest,
    { params }: RouteContext
) {
    const { id, versionId } = await params;

    try {
        // ✅ Find the specific version by ID
        const version = await prisma.formVersion.findUnique({
            where: { id: versionId },
            include: {
                formTemplate: {
                    select: { id: true, name: true },
                },
                submissions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!version) {
            return NextResponse.json(
                { error: 'Version not found' },
                { status: 404 }
            );
        }

        // ✅ Verify version belongs to the form
        if (version.formTemplateId !== id) {
            return NextResponse.json(
                { error: 'Version does not belong to this form' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            data: {
                formName: version.formTemplate.name,
                version: {
                    id: version.id,
                    versionNumber: version.versionNumber,
                    schema: version.schema,
                    createdAt: version.createdAt.toISOString(),
                    isLatest: version.isLatest,
                    submissions: version.submissions.map(s => ({
                        id: s.id,
                        payload: s.payload,
                        createdAt: s.createdAt.toISOString(),
                    })),
                },
            },
        });
    } catch (error) {
        console.error('GET /api/forms/[id]/versions/[versionId] failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}