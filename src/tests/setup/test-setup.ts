import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { vi } from 'vitest';

let prisma: PrismaClient | null = null;

export function getTestPrisma() {
    if (!prisma) {
        try {
            const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

            if (!connectionString) {
                throw new Error('DATABASE_URL or DIRECT_URL is not set in environment');
            }

            console.log('🔍 DATABASE_URL:', connectionString.replace(/:[^:]*@/, ':****@'));

            // Create a Pool instance
            const pool = new Pool({
                connectionString,
            });

            // Create the Prisma adapter for PostgreSQL
            const adapter = new PrismaPg(pool);

            // Create Prisma client with the adapter
            prisma = new PrismaClient({ adapter });

            console.log('✅ Prisma client created successfully with adapter');
        } catch (error) {
            console.error('❌ Failed to create Prisma client:', error);
            throw error;
        }
    }
    return prisma;
}

export async function setupTestDB() {
    const prisma = getTestPrisma();

    try {
        // Clean all tables in correct order (due to foreign keys)
        await prisma.submission.deleteMany({});
        await prisma.formVersion.deleteMany({});
        await prisma.formTemplate.deleteMany({});
        console.log('✅ Test database cleaned');
    } catch (error) {
        console.error('Error cleaning test database:', error);
        throw error;
    }
}

export async function teardownTestDB() {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

// Helper to create a test form with a version
export async function createTestForm(prisma: PrismaClient, overrides = {}) {
    const form = await prisma.formTemplate.create({
        data: {
            name: 'Test Form',
            ...overrides,
            versions: {
                create: {
                    versionNumber: 1,
                    isLatest: true,
                    schema: {
                        type: 'object',
                        required: ['name', 'email'],
                        properties: {
                            name: {
                                type: 'string',
                                minLength: 2,
                                description: 'Full Name'
                            },
                            email: {
                                type: 'string',
                                format: 'email',
                                description: 'Email Address'
                            }
                        }
                    }
                }
            }
        },
        include: {
            versions: true
        }
    });

    return form;
}

export async function createTestSubmission(prisma: PrismaClient, versionId: string, payload = {}) {
    return prisma.submission.create({
        data: {
            formVersionId: versionId,
            payload: {
                name: 'John Doe',
                email: 'john@example.com',
                ...payload
            }
        }
    });
}



// @vitest-environment node

vi.mock('@/lib/prisma', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }) };
});
