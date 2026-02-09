import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSale, type CreateSaleRequest, type Sale } from '../api/sales';

interface UseSaleOptions {
    onSuccess?: (data: Sale) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook to create a sale using TanStack Query mutation
 */
export function useSale(options?: UseSaleOptions) {
    const queryClient = useQueryClient();

    return useMutation<Sale, Error, CreateSaleRequest>({
        mutationFn: createSale,
        onSuccess: (data) => {
            // Invalidate sales queries to refetch
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
}
