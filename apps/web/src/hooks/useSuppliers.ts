import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    type CreateSupplierData,
} from '../api/suppliers';
import { toast } from 'react-hot-toast';

export function useSuppliers() {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: getSuppliers,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSupplierData) => createSupplier(data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['suppliers'] });
            toast.success('Proveedor creado exitosamente');
        },
        onError: () => {
            toast.error('Error al crear el proveedor');
        },
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierData> }) =>
            updateSupplier(id, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['suppliers'] });
            toast.success('Proveedor actualizado exitosamente');
        },
        onError: () => {
            toast.error('Error al actualizar el proveedor');
        },
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSupplier(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['suppliers'] });
            toast.success('Proveedor eliminado');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar el proveedor';
            toast.error(message);
        },
    });
}
