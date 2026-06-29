import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Vitest loaded DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        setupFiles: ['./src/tests/setup/vitest-setup.ts'],
        include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
        fileParallelism: false,
        server: {
            deps: {
                inline: ['server-only']
            }
        },
        testTimeout: 30000,
        hookTimeout: 30000,
        env: {
            DATABASE_URL: process.env.DATABASE_URL || '',
            DIRECT_URL: process.env.DIRECT_URL || '',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/modules/**/*.ts', 'src/app/api/**/*.ts'],
            exclude: ['src/tests/**', '**/*.types.ts']
        },
        alias: {
            '@': path.resolve(__dirname, './src')
        },
    }
});