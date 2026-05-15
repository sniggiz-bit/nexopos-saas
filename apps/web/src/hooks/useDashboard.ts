import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard';

/**
 * Hook to fetch dashboard stats.
 * tenantId is resolved server-side from the JWT — no need to pass it here.
 */
export function useDashboardStats(branchId?: string) {
    return useQuery({
        queryKey: ['dashboard', 'stats', branchId],
        queryFn: () => getDashboardStats(branchId),
        staleTime: 60 * 1000, // 1 minute cache
    });
}
