
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuote, CreateQuoteData, generateQuotePdf } from '../api/quotes';
import { toast } from 'react-hot-toast';

export function useCreateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateQuoteData) => createQuote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Preventa guardada exitosamente');
        },
        onError: (error: any) => {
            console.error('Error creating quote:', error);
            toast.error(error.response?.data?.message || 'Error al guardar preventa');
        }
    });
}

export function useQuotePdf() {
    return useMutation({
        mutationFn: (id: string) => generateQuotePdf(id),
        onError: (error: any) => {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar PDF');
        }
    });
}
