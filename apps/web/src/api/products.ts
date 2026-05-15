import { apiClient } from './client';
import type { Product } from './types';

/**
 * Fetch all products from the API
 */
export async function getProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
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
