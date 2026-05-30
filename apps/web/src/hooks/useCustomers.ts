import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, CreateCustomerData } from '../api/customers';
import { toast } from 'react-hot-toast';

export function useCustomers(_tenantId?: string) {
    return useQuery({
        queryKey: ['customers'],
        queryFn: () => getCustomers(),
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente creado exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al crear el cliente';
            toast.error(message);
        }
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) => updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente actualizado exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al actualizar el cliente';
            toast.error(message);
        }
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente eliminado exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al eliminar el cliente';
            toast.error(message);
        }
    });
}
