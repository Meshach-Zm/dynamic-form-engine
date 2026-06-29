// @vitest-environment node
import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { getTestPrisma, setupTestDB, teardownTestDB } from '../../setup/test-setup';

vi.mock('@/lib/prisma', async () => {
    const { getTestPrisma } = await import('../../setup/test-setup');
    return { prisma: getTestPrisma() };
});

import * as submissionsRoute from '@/app/api/forms/[id]/versions/[versionId]/submissions/route';
import * as unifiedSubmissionsRoute from '@/app/api/forms/[id]/submissions/route';

describe('Submissions API Integration Tests', () => {
    let prisma: any;
    let testForm: any;
    let testVersion: any;

    beforeAll(async () => {
        (globalThis as any).prisma = undefined;
        prisma = getTestPrisma();
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await prisma.submission.deleteMany({});
        await prisma.formVersion.deleteMany({});
        await prisma.formTemplate.deleteMany({});

        testForm = await prisma.formTemplate.create({
            data: {
                name: `Submissions Test Form ${Date.now()}`,
                versions: {
                    create: {
                        versionNumber: 1,
                        isLatest: true,
                        schema: {
                            type: 'object',
                            required: ['name', 'email'],
                            properties: {
                                name: { type: 'string', minLength: 2, description: 'Full Name' },
                                email: { type: 'string', format: 'email', description: 'Email Address' }
                            }
                        }
                    }
                }
            },
            include: { versions: true }
        });
        testVersion = testForm.versions[0];
    });

    // ✅ Tests for version-specific endpoint
    describe('POST /api/forms/:id/versions/:versionId/submissions', () => {
        it('should submit a valid response', async () => {
            await testApiHandler({
                appHandler: submissionsRoute,
                params: { id: testForm.id, versionId: testVersion.id },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payload: { name: 'Jane Smith', email: 'jane@example.com' } })
                    });

                    expect(response.status).toBe(201);
                    const data = await response.json();
                    expect(data.data).toBeDefined();
                    expect(data.data.id).toBeDefined();

                    const submissions = await prisma.submission.findMany();
                    expect(submissions).toHaveLength(1);
                    expect(submissions[0].payload).toEqual({ name: 'Jane Smith', email: 'jane@example.com' });
                }
            });
        });

        it('should reject missing required fields', async () => {
            await testApiHandler({
                appHandler: submissionsRoute,
                params: { id: testForm.id, versionId: testVersion.id },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payload: { email: 'jane@example.com' } })
                    });

                    expect(response.status).toBe(422);
                    const data = await response.json();
                    expect(data.error).toBe('Validation failed');
                    expect(data.details).toBeDefined();
                }
            });
        });

        it('should reject invalid email format', async () => {
            await testApiHandler({
                appHandler: submissionsRoute,
                params: { id: testForm.id, versionId: testVersion.id },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payload: { name: 'Jane Smith', email: 'not-an-email' } })
                    });

                    expect(response.status).toBe(422);
                    const data = await response.json();
                    expect(data.error).toBe('Validation failed');
                }
            });
        });

        it('should reject submissions to non-existent version', async () => {
            await testApiHandler({
                appHandler: submissionsRoute,
                params: { id: testForm.id, versionId: 'non-existent-id' },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payload: { name: 'Test', email: 'test@example.com' } })
                    });

                    expect(response.status).toBe(404);
                }
            });
        });

        it('should reject submissions to wrong form', async () => {
            const otherForm = await prisma.formTemplate.create({
                data: {
                    name: `Other Form ${Date.now()}`,
                    versions: {
                        create: {
                            versionNumber: 1,
                            isLatest: true,
                            schema: { type: 'object' }
                        }
                    }
                }
            });

            await testApiHandler({
                appHandler: submissionsRoute,
                params: { id: otherForm.id, versionId: testVersion.id },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payload: { name: 'Test', email: 'test@example.com' } })
                    });

                    expect(response.status).toBe(400);
                    const data = await response.json();
                    expect(data.error).toBe('Version does not belong to this form');
                }
            });
        });
    });

    // ✅ Tests for unified submissions endpoint
    describe('GET /api/forms/:id/submissions (unified)', () => {
        it('should return all submissions across all versions', async () => {
            // Create a second version
            const version2 = await prisma.formVersion.create({
                data: {
                    formTemplateId: testForm.id,
                    versionNumber: 2,
                    isLatest: false,
                    schema: { type: 'object' }
                }
            });

            await prisma.submission.createMany({
                data: [
                    { formVersionId: testVersion.id, payload: { name: 'Alice' } },
                    { formVersionId: testVersion.id, payload: { name: 'Bob' } },
                    { formVersionId: version2.id, payload: { name: 'Charlie' } }
                ]
            });

            await testApiHandler({
                appHandler: unifiedSubmissionsRoute,
                params: { id: testForm.id },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(200);
                    const data = await response.json();
                    expect(data.data).toHaveLength(3);
                    expect(data.pagination).toBeDefined();
                    expect(data.pagination.total).toBe(3);
                }
            });
        });

        it('should return empty array when no submissions exist', async () => {
            await testApiHandler({
                appHandler: unifiedSubmissionsRoute,
                params: { id: testForm.id },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(200);
                    const data = await response.json();
                    expect(data.data).toHaveLength(0);
                    expect(data.pagination.total).toBe(0);
                }
            });
        });

        it('should return 404 for non-existent form', async () => {
            await testApiHandler({
                appHandler: unifiedSubmissionsRoute,
                params: { id: 'non-existent-id' },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(404);
                    const data = await response.json();
                    expect(data.error).toBe('Form not found');
                }
            });
        });
    });
});