import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBrands, createBrand, updateBrand, deleteBrand, CreateBrandData } from '../api/brands';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function useBrands(tenantId: string = 'tenant-1') {
    return useQuery({
        queryKey: ['brands', tenantId],
        queryFn: () => getBrands(tenantId),
    });
}

export function useCreateBrand() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (data: CreateBrandData) => createBrand(data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['brands', user?.tenantId] });
            toast.success('Marca creada exitosamente');
        },
        onError: () => {
            toast.error('Error al crear la marca');
        }
    });
}

export function useUpdateBrand() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateBrand(id, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['brands', user?.tenantId] });
            toast.success('Marca actualizada exitosamente');
        },
        onError: () => {
            toast.error('Error al actualizar la marca');
        }
    });
}

export function useDeleteBrand() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (id: string) => deleteBrand(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['brands', user?.tenantId] });
            toast.success('Marca eliminada exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar la marca';
            toast.error(message);
        }
    });
}
