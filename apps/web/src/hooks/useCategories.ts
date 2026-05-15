import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory, CreateCategoryData, Category } from '../api/categories';
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
        onSuccess: (newCategory) => {
            queryClient.setQueryData<Category[]>(['categories'], (old = []) =>
                [...old, newCategory].sort((a, b) => a.name.localeCompare(b.name))
            );
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
        onSuccess: (updatedCategory) => {
            queryClient.setQueryData<Category[]>(['categories'], (old = []) =>
                old.map(c => c.id === updatedCategory.id ? updatedCategory : c)
            );
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
        onSuccess: (_, id) => {
            queryClient.setQueryData<Category[]>(['categories'], (old = []) =>
                old.filter(c => c.id !== id)
            );
            toast.success('Categoría eliminada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar la categoría';
            toast.error(message);
        }
    });
}
