import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface Category {
    id: string;
    name: string;
    productCount?: number;
}

async function getCategories(tenantId: string = 'tenant-1'): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(`/categories?tenantId=${tenantId}`);
    return response.data;
}

export function useCategories(tenantId?: string) {
    return useQuery<Category[], Error>({
        queryKey: ['categories', tenantId],
        queryFn: () => getCategories(tenantId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
