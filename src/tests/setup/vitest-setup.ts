import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

vi.mock('server-only', () => ({}));

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('🔍 Test setup DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useParams: () => ({ id: 'test-id' }),
}));

// ✅ DO NOT mock global.fetch — NTARH needs the real fetch to work
// global.fetch = vi.fn();  <-- remove this line

afterEach(() => {
    vi.clearAllMocks();
});