import { useQuery } from '@tanstack/react-query';
import { getSales, type GetSalesParams, type Sale } from '../api/sales';

interface UseSalesOptions {
    filters?: GetSalesParams;
}

/**
 * Hook to fetch sales with optional filters using TanStack Query
 */
export function useSales(options?: UseSalesOptions) {
    return useQuery<Sale[], Error>({
        queryKey: ['sales', options?.filters],
        queryFn: () => getSales(options?.filters),
    });
}
