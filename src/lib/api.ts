import type { FormTemplate } from '@/types/form';

export async function getForms(): Promise<FormTemplate[]> {
    try {
        // ✅ Relative URL works everywhere
        const res = await fetch('/api/forms?page=1&limit=100', {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error('Failed to fetch forms:', res.status);
            return [];
        }

        const json = await res.json();

        if (json.data && Array.isArray(json.data)) {
            return json.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching forms:', error);
        return [];
    }
}