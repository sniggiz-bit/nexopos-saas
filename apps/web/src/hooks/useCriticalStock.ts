import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../api/types';

export function useCriticalStock(tenantId: string, branchId?: string) {
    return useQuery({
        queryKey: ['products', 'critical', tenantId, branchId],
        queryFn: async () => {
            const params = new URLSearchParams({ tenantId });
            if (branchId) params.append('branchId', branchId);

            const { data } = await apiClient.get<Product[]>(`/products/critical?${params.toString()}`);
            return data;
        },
    });
}
