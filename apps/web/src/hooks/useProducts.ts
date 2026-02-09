import { useQuery } from '@tanstack/react-query';
import { getProducts, type Product } from '../api/products';

/**
 * Hook to fetch products using TanStack Query
 */
export function useProducts() {
    return useQuery<Product[], Error>({
        queryKey: ['products'],
        queryFn: getProducts,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
