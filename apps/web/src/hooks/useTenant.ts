import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Tenant } from '@nexopos/shared';

async function getTenant(id: string): Promise<Tenant> {
    const res = await apiClient.get<Tenant>(`/tenants/${id}`);
    return res.data;
}

export function useTenant(tenantId?: string | null) {
    return useQuery<Tenant>({
        queryKey: ['tenant', tenantId],
        queryFn: () => getTenant(tenantId!),
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 10,
    });
}
