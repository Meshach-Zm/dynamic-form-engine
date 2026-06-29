import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    req: NextRequest,
    { params }: RouteContext
) {
    const { id } = await params;

    try {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Check if form exists
        const form = await prisma.formTemplate.findUnique({
            where: { id },
            select: { id: true, name: true },
        });

        if (!form) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // Get all submissions across all versions with pagination
        const [submissions, total] = await Promise.all([
            prisma.submission.findMany({
                where: {
                    formVersion: {
                        formTemplateId: id,
                    },
                },
                include: {
                    formVersion: {
                        select: {
                            versionNumber: true,
                            isLatest: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.submission.count({
                where: {
                    formVersion: {
                        formTemplateId: id,
                    },
                },
            }),
        ]);

        return NextResponse.json(
            {
                data: submissions.map(s => ({
                    id: s.id,
                    payload: s.payload,
                    files: s.files,
                    createdAt: s.createdAt.toISOString(),
                    version: {
                        versionNumber: s.formVersion.versionNumber,
                        isLatest: s.formVersion.isLatest,
                    },
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            },
            {
                headers: {
                    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
                },
            }
        );
    } catch (error) {
        console.error('GET /api/forms/[id]/submissions failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}