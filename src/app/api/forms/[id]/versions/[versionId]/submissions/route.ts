import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validationService } from '@/modules/validation/validation.service';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string; versionId: string }>;
};

const submitSchema = z.object({
  payload: z.record(z.any()),
});

export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  const { id, versionId } = await params;

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let payload: Record<string, any> = {};
    let fileData: Record<string, any> = {};

    if (isMultipart) {
      const formData = await req.formData();

      // Extract payload JSON
      const payloadStr = formData.get('payload') as string;
      if (payloadStr) {
        payload = JSON.parse(payloadStr);
      }

      // ✅ Upload files to Cloudinary
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && key !== 'payload') {
          const file = value as File;

          // Check if it's an array field (multiple files) - key ends with []
          if (key.endsWith('[]')) {
            const fieldName = key.replace('[]', '');
            if (!fileData[fieldName]) {
              fileData[fieldName] = [];
            }
            const result = await uploadToCloudinary(file);
            fileData[fieldName].push({
              name: file.name,
              fileName: file.name,
              size: file.size,
              type: file.type,
              url: result.viewUrl,
              viewUrl: result.viewUrl,
              downloadUrl: result.downloadUrl,
              publicId: result.publicId,
            });
          } else {
            // Single file
            const result = await uploadToCloudinary(file);
            fileData[key] = {
              name: file.name,
              fileName: file.name,
              size: file.size,
              type: file.type,
              url: result.viewUrl,
              viewUrl: result.viewUrl,
              downloadUrl: result.downloadUrl,
              publicId: result.publicId,
            };
          }
        }
      }
    } else {
      // Regular JSON request
      const body = await req.json();
      const parsed = submitSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', issues: parsed.error.flatten() },
          { status: 400 }
        );
      }
      payload = parsed.data.payload;
    }

    // Verify version exists and belongs to the form
    const version = await prisma.formVersion.findUnique({
      where: { id: versionId },
      include: {
        formTemplate: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    if (version.formTemplateId !== id) {
      return NextResponse.json(
        { error: 'Version does not belong to this form' },
        { status: 400 }
      );
    }

    // ✅ Validate payload against JSON Schema
    const validationResult = validationService.validate(
      version.schema as any,
      payload
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 422 }
      );
    }

    // ✅ Store submission with file data
    const submission = await prisma.submission.create({
      data: {
        formVersionId: version.id,
        payload: payload as Prisma.InputJsonValue,
        files: Object.keys(fileData).length > 0
          ? fileData as Prisma.InputJsonValue
          : undefined,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: submission.id,
          createdAt: submission.createdAt.toISOString(),
          versionId: submission.formVersionId,
          files: submission.files,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST submissions failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const { id, versionId } = await params;

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const version = await prisma.formVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    if (version.formTemplateId !== id) {
      return NextResponse.json(
        { error: 'Version does not belong to this form' },
        { status: 400 }
      );
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { formVersionId: versionId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.submission.count({
        where: { formVersionId: versionId },
      }),
    ]);

    return NextResponse.json({
      data: submissions.map(s => ({
        id: s.id,
        payload: s.payload,
        files: s.files,
        createdAt: s.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('GET submissions failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}