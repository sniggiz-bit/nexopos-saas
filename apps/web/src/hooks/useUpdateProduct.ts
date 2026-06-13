import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../api/types';
import type { PriceTier } from '@nexopos/shared';
import toast from 'react-hot-toast';

interface UpdateProductData {
    id: string;
    name?: string;
    sku?: string;
    barcode?: string;
    price?: number;
    costPrice?: number;
    minStock?: number;
    unitType?: 'UNIT' | 'WEIGHT';
    categoryId?: string;
    brandId?: string;
    image?: string;
    isActive?: boolean;
    stock?: number;
    priceTiers?: PriceTier[];
    galleryImages?: string[];
}

async function updateProduct({ id, ...data }: UpdateProductData): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProduct,
        onSuccess: (updatedProduct) => {
            queryClient.setQueryData<Product[]>(['products'], (old = []) =>
                old.map(p => p.id === updatedProduct.id ? updatedProduct : p)
            );
            toast.success('Producto actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar el producto');
        },
    });
}
