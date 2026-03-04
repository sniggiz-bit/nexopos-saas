import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPurchases,
    createPurchase,
    type CreatePurchaseData,
} from '../api/purchases';
import { toast } from 'react-hot-toast';

export function usePurchases(branchId?: string) {
    return useQuery({
        queryKey: ['purchases', branchId],
        queryFn: () => getPurchases(branchId),
    });
}

export function useCreatePurchase() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePurchaseData) => createPurchase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            // Also invalidate inventory/products so stock reflects immediately
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Compra registrada y stock actualizado exitosamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al registrar la compra';
            toast.error(message);
        },
    });
}
