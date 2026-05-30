import { apiClient } from './client';
import type { Product } from './types';

export interface PaginatedProductsResponse {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ProductsQueryParams {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
}

/**
 * Fetch paginated products from the API with optional server-side
 * filtering by search term, category and pagination params.
 */
export async function getProductsPaginated(
    params: ProductsQueryParams = {},
): Promise<PaginatedProductsResponse> {
    const query = new URLSearchParams();
    if (params.search)     query.set('search',     params.search);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.page)       query.set('page',       String(params.page));
    if (params.limit)      query.set('limit',      String(params.limit));

    const url = `/products${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<PaginatedProductsResponse>(url);
    return response.data;
}

/**
 * Fetch a single product by ID
 */
export async function getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
}

// Re-export types
export type { Product, ProductsResponse } from './types';

