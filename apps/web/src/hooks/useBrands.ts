import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBrands, createBrand, updateBrand, deleteBrand, CreateBrandData } from '../api/brands';
import { toast } from 'react-hot-toast';

export function useBrands() {
    return useQuery({
        queryKey: ['brands'],
        queryFn: () => getBrands(),
    });
}

export function useCreateBrand() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBrandData) => createBrand(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'], refetchType: 'all' });
            toast.success('Marca creada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al crear la marca';
            toast.error(message);
        }
    });
}

export function useUpdateBrand() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateBrand(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'], refetchType: 'all' });
            toast.success('Marca actualizada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al actualizar la marca';
            toast.error(message);
        }
    });
}

export function useDeleteBrand() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteBrand(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'], refetchType: 'all' });
            toast.success('Marca eliminada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar la marca';
            toast.error(message);
        }
    });
}
