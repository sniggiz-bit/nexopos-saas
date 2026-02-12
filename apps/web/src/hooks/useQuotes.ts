
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotes, createQuote, generateQuotePdf } from '../api/quotes';

export function useQuotes(tenantId: string = 'tenant-1') {
    return useQuery({
        queryKey: ['quotes', tenantId],
        queryFn: () => getQuotes(tenantId),
    });
}

export function useCreateQuote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
}

export function useQuotePdf() {
    return useMutation({
        mutationFn: generateQuotePdf,
    });
}
