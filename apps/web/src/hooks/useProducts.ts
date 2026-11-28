import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getProductsPaginated, type PaginatedProductsResponse, type ProductsQueryParams } from '../api/products';

/**
 * Fetch products with server-side pagination,
 * search and category filtering.
 *
 * - Uses keepPreviousData to avoid flickering when navigating between pages.
 * - staleTime of 30s avoids redundant refetches while the cashier works.
 *
 * @param filters - { search, categoryId, page, limit }
 */
export function useProductPage(filters: ProductsQueryParams = {}) {
    return useQuery<PaginatedProductsResponse, Error>({
        queryKey: ['products', filters.search ?? '', filters.categoryId ?? '', filters.page ?? 1, filters.limit ?? 50],
        queryFn: ({ signal }) => getProductsPaginated(filters, { signal }),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    });
}

export const useProductsPOS = useProductPage;

/**
 * Backward-compatible hook for admin/dashboard pages that need
 * a flat list of all active products.
 *
 * Accepts an optional `_tenantId` param (ignored — server resolves from JWT)
 * so existing call sites `useProducts(user.tenantId)` continue to compile.
 */
export function useProducts(_tenantId?: string) {
    return useQuery({
        queryKey: ['products-all'],
        queryFn: async ({ signal }) => {
            const limit = 200;
            const first = await getProductsPaginated({ page: 1, limit }, { signal });
            const products = new Map(first.data.map(product => [product.id, product]));

            for (let page = 2; page <= first.totalPages; page++) {
                const next = await getProductsPaginated({ page, limit }, { signal });
                for (const product of next.data) products.set(product.id, product);
            }

            return Array.from(products.values());
        },
        staleTime: 30_000,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchInterval: 1000 * 120,
    });
}

