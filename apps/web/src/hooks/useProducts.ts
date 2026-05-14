import { useQuery } from '@tanstack/react-query';
import { getProducts, type Product } from '../api/products';

/**
 * Hook to fetch products using TanStack Query.
 * tenantId is resolved server-side from the JWT — no need to pass it here.
 */
export function useProducts() {
    return useQuery<Product[], Error>({
        queryKey: ['products'],
        queryFn: () => getProducts(),
        staleTime: 0,
        refetchOnWindowFocus: true,
    });
}
