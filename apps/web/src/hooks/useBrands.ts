import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface Brand {
    id: string;
    name: string;
    productCount?: number;
}

async function getBrands(tenantId: string = 'tenant-1'): Promise<Brand[]> {
    const response = await apiClient.get<Brand[]>(`/brands?tenantId=${tenantId}`);
    return response.data;
}

export function useBrands(tenantId?: string) {
    return useQuery<Brand[], Error>({
        queryKey: ['brands', tenantId],
        queryFn: () => getBrands(tenantId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
