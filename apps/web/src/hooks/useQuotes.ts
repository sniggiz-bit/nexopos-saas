import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuote, CreateQuoteData, generateQuotePdf, convertQuote, updateQuote } from '../api/quotes';
import { toast } from 'react-hot-toast';

export function useCreateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateQuoteData) => createQuote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Cotización creada exitosamente');
        },
        onError: (error: any) => {
            console.error('Error creating quote:', error);
            toast.error(error.response?.data?.message || 'Error al crear cotización');
        }
    });
}

export function useUpdateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CreateQuoteData> }) => updateQuote(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Cotización actualizada exitosamente');
        },
        onError: (error: any) => {
            console.error('Error updating quote:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar cotización');
        }
    });
}

export function useConvertQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => convertQuote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            toast.success('Cotización convertida a venta exitosamente');
        },
        onError: (error: any) => {
            console.error('Error converting quote:', error);
            toast.error(error.response?.data?.message || 'Error al convertir cotización');
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
