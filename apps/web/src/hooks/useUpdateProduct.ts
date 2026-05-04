import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../api/types';
import type { PriceTier } from '@nexopos/shared';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

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
}

async function updateProduct({ id, ...data }: UpdateProductData): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: updateProduct,
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['products', user?.tenantId] });
            toast.success('Producto actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar el producto');
        },
    });
}
