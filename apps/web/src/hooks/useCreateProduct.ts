import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../api/types';
import type { PriceTier } from '@nexopos/shared';

interface CreateProductData {
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    costPrice: number;
    minStock: number;
    unitType: 'UNIT' | 'WEIGHT';
    categoryId?: string;
    brandId?: string;
    image?: string;
    isActive: boolean;
    initialStock?: number;
    tenantId: string;
    branchId?: string;
    priceTiers?: PriceTier[];
}

async function createProduct(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            // Invalidate products query to refetch the list
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
