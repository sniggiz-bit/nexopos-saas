
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCredits, createCredit, addCreditPayment, AddPaymentData } from '../api/credits';
import { useAuth } from '@/context/AuthContext';

export function useCredits(customerId?: string) {
    const { user } = useAuth();
    const tenantId = user?.tenantId || 'tenant-1';
    return useQuery({
        queryKey: ['credits', tenantId, customerId],
        queryFn: () => getCredits(tenantId, customerId),
        enabled: !!user?.tenantId,
    });
}

export function useCreateCredit() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: createCredit,
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['credits', user?.tenantId] });
        },
    });
}

export function useAddCreditPayment() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: AddPaymentData }) => addCreditPayment(id, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['credits', user?.tenantId] });
        },
    });
}
