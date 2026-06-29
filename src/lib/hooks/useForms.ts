import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface Form {
    id: string;
    name: string;
    createdAt: string;
    versions: any[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export function useForms(page: number = 1, limit: number = 10) {
    const { data, error, isLoading, mutate } = useSWR(
        `/api/forms?page=${page}&limit=${limit}`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute
            keepPreviousData: true,
        }
    );

    return {
        forms: data?.data || [],
        pagination: data?.pagination as Pagination | undefined,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useForm(id: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        id ? `/api/forms/${id}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    return {
        form: data?.data,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useVersion(formId: string | null, versionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        formId && versionId ? `/api/forms/${formId}/versions/${versionId}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    return {
        version: data?.data?.version,
        formName: data?.data?.formName,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useSubmissions(formId: string | null, page: number = 1, limit: number = 10) {
    const { data, error, isLoading, mutate } = useSWR(
        formId ? `/api/forms/${formId}/submissions?page=${page}&limit=${limit}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    return {
        submissions: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        isError: error,
        mutate,
    };
}