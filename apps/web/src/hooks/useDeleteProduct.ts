import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

async function deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['products', user?.tenantId] });
            toast.success('Producto eliminado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar el producto');
        },
    });
}
