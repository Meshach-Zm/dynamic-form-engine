import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Add cache headers
export const dynamic = 'force-dynamic'; // For ISR

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [forms, total] = await Promise.all([
      prisma.formTemplate.findMany({
        skip,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.formTemplate.count(),
    ]);

    // ✅ Add caching headers
    return NextResponse.json(
      {
        data: forms.map(form => ({
          ...form,
          createdAt: form.createdAt.toISOString(),
          updatedAt: form.updatedAt.toISOString(),
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
    console.error('GET /api/forms failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ ADD THE POST HANDLER
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, schema } = body;

    if (!name || !schema) {
      return NextResponse.json(
        { error: 'Name and schema are required' },
        { status: 400 }
      );
    }

    const form = await prisma.formTemplate.create({
      data: {
        name,
        versions: {
          create: {
            versionNumber: 1,
            schema: schema,
            isLatest: true,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return NextResponse.json({ data: form }, { status: 201 });
  } catch (error) {
    console.error('POST /api/forms failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}