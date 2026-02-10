import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

async function deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto eliminado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar el producto');
        },
    });
}
