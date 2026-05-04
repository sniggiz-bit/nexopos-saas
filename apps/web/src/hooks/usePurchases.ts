import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPurchases,
    createPurchase,
    type CreatePurchaseData,
} from '../api/purchases';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function usePurchases(branchId?: string) {
    return useQuery({
        queryKey: ['purchases', branchId],
        queryFn: () => getPurchases(branchId),
    });
}

export function useCreatePurchase() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (data: CreatePurchaseData) => createPurchase(data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['purchases', user?.branchId] });
            queryClient.refetchQueries({ queryKey: ['products', user?.tenantId] });
            toast.success('Compra registrada y stock actualizado exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al registrar la compra';
            toast.error(message);
        },
    });
}
