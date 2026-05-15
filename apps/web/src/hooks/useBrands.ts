import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBrands, createBrand, updateBrand, deleteBrand, CreateBrandData, Brand } from '../api/brands';
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
        onSuccess: (newBrand) => {
            console.log('[useBrands] onSuccess - newBrand:', newBrand);
            console.log('[useBrands] cache before:', queryClient.getQueryData(['brands']));
            queryClient.setQueryData<Brand[]>(['brands'], (old = []) => {
                const updated = [...old, newBrand].sort((a, b) => a.name.localeCompare(b.name));
                console.log('[useBrands] cache updated to:', updated);
                return updated;
            });
            console.log('[useBrands] cache after:', queryClient.getQueryData(['brands']));
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
        onSuccess: (updatedBrand) => {
            queryClient.setQueryData<Brand[]>(['brands'], (old = []) =>
                old.map(b => b.id === updatedBrand.id ? updatedBrand : b)
            );
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
        onSuccess: (_, id) => {
            queryClient.setQueryData<Brand[]>(['brands'], (old = []) =>
                old.filter(b => b.id !== id)
            );
            toast.success('Marca eliminada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar la marca';
            toast.error(message);
        }
    });
}
