import { useQuery } from '@tanstack/react-query';
import { getProducts, type Product } from '../api/products';

/**
 * Hook to fetch products using TanStack Query
 */
export function useProducts(tenantId?: string) {
    return useQuery<Product[], Error>({
        queryKey: ['products', tenantId],
        queryFn: () => getProducts(tenantId),
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 60,
    });
}
