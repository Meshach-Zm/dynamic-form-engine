import type { FormTemplate } from '@/types/form';

export async function getForms(): Promise<FormTemplate[]> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
        const res = await fetch(`${baseUrl}/api/forms?page=1&limit=100`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error('Failed to fetch forms:', res.status);
            return [];
        }

        const json = await res.json();

        // Handle both array and paginated responses
        if (json.data && Array.isArray(json.data)) {
            return json.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching forms:', error);
        return [];
    }
}