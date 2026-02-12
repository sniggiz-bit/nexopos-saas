
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCredits, createCredit, addCreditPayment, AddPaymentData } from '../api/credits';

export function useCredits(tenantId: string = 'tenant-1', customerId?: string) {
    return useQuery({
        queryKey: ['credits', tenantId, customerId],
        queryFn: () => getCredits(tenantId, customerId),
    });
}

export function useCreateCredit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCredit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credits'] });
        },
    });
}

export function useAddCreditPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: AddPaymentData }) => addCreditPayment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credits'] });
        },
    });
}
