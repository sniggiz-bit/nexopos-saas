import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory, CreateCategoryData } from '../api/categories';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function useCategories(tenantId: string = 'tenant-1') {
    return useQuery({
        queryKey: ['categories', tenantId],
        queryFn: () => getCategories(tenantId),
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (data: CreateCategoryData) => createCategory(data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['categories', user?.tenantId] });
            toast.success('Categoría creada exitosamente');
        },
        onError: () => {
            toast.error('Error al crear la categoría');
        }
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['categories', user?.tenantId] });
            toast.success('Categoría actualizada exitosamente');
        },
        onError: () => {
            toast.error('Error al actualizar la categoría');
        }
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['categories', user?.tenantId] });
            toast.success('Categoría eliminada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar la categoría';
            toast.error(message);
        }
    });
}
