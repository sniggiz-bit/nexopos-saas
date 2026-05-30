import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getProductsPaginated, type PaginatedProductsResponse, type ProductsQueryParams } from '../api/products';
import type { Product } from '../api/types';

/**
 * Hook for fetching products in the POS with server-side pagination,
 * search and category filtering.
 *
 * - Uses keepPreviousData to avoid flickering when navigating between pages.
 * - staleTime of 30s avoids redundant refetches while the cashier works.
 *
 * @param filters - { search, categoryId, page, limit }
 */
export function useProductsPOS(filters: ProductsQueryParams = {}) {
    return useQuery<PaginatedProductsResponse, Error>({
        queryKey: ['products', filters.search ?? '', filters.categoryId ?? '', filters.page ?? 1, filters.limit ?? 50],
        queryFn: () => getProductsPaginated(filters),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    });
}

/**
 * Backward-compatible hook for admin/dashboard pages that need
 * a flat list of all active products.
 *
 * Accepts an optional `_tenantId` param (ignored — server resolves from JWT)
 * so existing call sites `useProducts(user.tenantId)` continue to compile.
 */
export function useProducts(_tenantId?: string) {
    const result = useQuery<PaginatedProductsResponse, Error>({
        queryKey: ['products-all'],
        queryFn: () => getProductsPaginated({ limit: 200 }),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchInterval: 1000 * 120,
    });

    return {
        ...result,
        data: result.data?.data as Product[] | undefined,
    };
}

