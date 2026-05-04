
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, CreateCustomerData } from '../api/customers';
import { useAuth } from '@/context/AuthContext';

export function useCustomers(tenantId?: string) {
    return useQuery({
        queryKey: ['customers', tenantId],
        queryFn: () => getCustomers(tenantId!),
        enabled: !!tenantId,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['customers', user?.tenantId] });
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) => updateCustomer(id, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['customers', user?.tenantId] });
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['customers', user?.tenantId] });
        },
    });
}
