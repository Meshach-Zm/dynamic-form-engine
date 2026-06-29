// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestPrisma, setupTestDB, teardownTestDB } from '../../setup/test-setup';

describe('Database Connection', () => {
    let prisma: any;

    beforeAll(async () => {
        prisma = getTestPrisma();
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    it('should create and delete a test form', async () => {
        const form = await prisma.formTemplate.create({
            data: {
                name: `Connection Test Form ${Date.now()}`,
                versions: {
                    create: { versionNumber: 1, isLatest: true, schema: { type: 'object' } }
                }
            }
        });

        expect(form.id).toBeDefined();

        // ✅ Just delete the template — cascade handles versions
        await prisma.formTemplate.delete({ where: { id: form.id } });

        const deleted = await prisma.formTemplate.findUnique({ where: { id: form.id } });
        expect(deleted).toBeNull();

        console.log('✅ Form created and deleted successfully');
    });

    it('should create and delete a test form', async () => {
        const form = await prisma.formTemplate.create({
            data: {
                name: `Connection Test Form ${Date.now()}`,
                versions: {
                    create: {
                        versionNumber: 1,
                        isLatest: true,
                        schema: { type: 'object' }
                    }
                }
            }
        });

        expect(form.id).toBeDefined();

        await prisma.formVersion.deleteMany({ where: { formTemplateId: form.id } });
        await prisma.formTemplate.delete({ where: { id: form.id } });

        const deleted = await prisma.formTemplate.findUnique({ where: { id: form.id } });
        expect(deleted).toBeNull();

        console.log('✅ Form created and deleted successfully');
    });
});