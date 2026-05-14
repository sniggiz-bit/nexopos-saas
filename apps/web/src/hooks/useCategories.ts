import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory, CreateCategoryData } from '../api/categories';
import { toast } from 'react-hot-toast';

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(),
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCategoryData) => createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
            toast.success('Categoría creada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al crear la categoría';
            toast.error(message);
        }
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
            toast.success('Categoría actualizada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al actualizar la categoría';
            toast.error(message);
        }
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
            toast.success('Categoría eliminada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar la categoría';
            toast.error(message);
        }
    });
}
