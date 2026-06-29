// @vitest-environment node
import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { getTestPrisma, setupTestDB, teardownTestDB } from '../../setup/test-setup';

vi.mock('@/lib/prisma', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }) };
});

import * as formsRoute from '@/app/api/forms/route';
import * as formByIdRoute from '@/app/api/forms/[id]/route';
import * as versionsRoute from '@/app/api/forms/[id]/versions/route';

describe('Forms API Integration Tests', () => {
    let prisma: any;

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
    });

    describe('GET /api/forms', () => {
        it('should return empty array when no forms exist', async () => {
            await testApiHandler({
                appHandler: formsRoute,
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(200);
                    const data = await response.json();
                    expect(data.data).toEqual([]);
                }
            });
        });

        it('should return all forms with their versions', async () => {
            await prisma.formTemplate.create({
                data: {
                    name: `Test Form ${Date.now()}`,
                    versions: {
                        create: { versionNumber: 1, isLatest: true, schema: { type: 'object' } }
                    }
                }
            });

            await testApiHandler({
                appHandler: formsRoute,
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(200);
                    const data = await response.json();
                    expect(data.data).toHaveLength(1);
                    expect(data.data[0].versions).toHaveLength(1);
                }
            });
        });
    });

    describe('POST /api/forms', () => {
        it('should create a new form with a version', async () => {
            await testApiHandler({
                appHandler: formsRoute,
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: `New Form ${Date.now()}`,
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' }
                                }
                            }
                        })
                    });

                    expect(response.status).toBe(201);
                    const data = await response.json();
                    expect(data.data).toBeDefined();
                    expect(data.data.id).toBeDefined();
                }
            });
        });

        it('should reject invalid form data', async () => {
            await testApiHandler({
                appHandler: formsRoute,
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invalid: true })
                    });

                    expect(response.status).toBe(400);
                }
            });
        });
    });

    describe('GET /api/forms/:id', () => {
        it('should return a specific form with its latest version', async () => {
            const form = await prisma.formTemplate.create({
                data: {
                    name: `Detail Form ${Date.now()}`,
                    versions: {
                        create: { versionNumber: 1, isLatest: true, schema: { type: 'object' } }
                    }
                },
                include: { versions: true }
            });

            await testApiHandler({
                appHandler: formByIdRoute,
                params: { id: form.id },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(200);
                    const data = await response.json();
                    expect(data.data.id).toBe(form.id);
                    expect(data.data.latestVersion).toBeDefined();
                }
            });
        });

        it('should return 404 for non-existent form', async () => {
            await testApiHandler({
                appHandler: formByIdRoute,
                params: { id: 'non-existent-id' },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(404);
                }
            });
        });
    });

    describe('GET /api/forms/:id/versions', () => {
        it('should return all versions of a form', async () => {
            const form = await prisma.formTemplate.create({
                data: {
                    name: `Versions Form ${Date.now()}`,
                    versions: {
                        create: { versionNumber: 1, isLatest: true, schema: { type: 'object' } }
                    }
                }
            });

            await testApiHandler({
                appHandler: versionsRoute,
                params: { id: form.id },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(200);
                    const data = await response.json();
                    expect(data.data).toHaveLength(1);
                }
            });
        });

        it('should return 404 for non-existent form', async () => {
            await testApiHandler({
                appHandler: versionsRoute,
                params: { id: 'non-existent-id' },
                async test({ fetch }) {
                    const response = await fetch({ method: 'GET' });

                    expect(response.status).toBe(404);
                }
            });
        });
    });

    describe('POST /api/forms/:id/versions', () => {
        it('should publish a new version', async () => {
            const form = await prisma.formTemplate.create({
                data: {
                    name: `Publish Form ${Date.now()}`,
                    versions: {
                        create: {
                            versionNumber: 1,
                            isLatest: true,
                            schema: { type: 'object', properties: { name: { type: 'string' } } }
                        }
                    }
                }
            });

            await testApiHandler({
                appHandler: versionsRoute,
                params: { id: form.id },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    age: { type: 'number' }
                                }
                            }
                        })
                    });

                    expect(response.status).toBe(201);
                    const data = await response.json();
                    expect(data.data.versionNumber).toBe(2);
                    expect(data.data.isLatest).toBe(true);
                }
            });
        });

        it('should reject identical schema', async () => {
            const schema = { type: 'object', properties: { name: { type: 'string' } } };
            const form = await prisma.formTemplate.create({
                data: {
                    name: `Identical Schema Form ${Date.now()}`,
                    versions: {
                        create: { versionNumber: 1, isLatest: true, schema }
                    }
                }
            });

            await testApiHandler({
                appHandler: versionsRoute,
                params: { id: form.id },
                async test({ fetch }) {
                    const response = await fetch({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ schema })
                    });

                    expect(response.status).toBe(400);
                    const data = await response.json();
                    expect(data.error).toBe('Schema is identical to the current version');
                }
            });
        });
    });
});