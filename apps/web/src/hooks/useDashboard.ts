import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard';

export function useDashboardStats(tenantId: string, branchId: string = 'branch-1') {
    return useQuery({
        queryKey: ['dashboard', 'stats', tenantId, branchId],
        queryFn: () => getDashboardStats(tenantId, branchId),
        enabled: !!tenantId,
    });
}
