import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuote, CreateQuoteData, generateQuotePdf, convertQuote, updateQuote, deleteQuote } from '../api/quotes';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function useCreateQuote() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (data: CreateQuoteData) => createQuote(data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['quotes', user?.tenantId] });
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
    const { user } = useAuth();

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CreateQuoteData> }) => updateQuote(id, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['quotes', user?.tenantId] });
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
    const { user } = useAuth();

    return useMutation({
        mutationFn: (id: string) => convertQuote(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['quotes', user?.tenantId] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            toast.success('Cotización convertida a venta exitosamente');
        },
        onError: (error: any) => {
            console.error('Error converting quote:', error);
            toast.error(error.response?.data?.message || 'Error al convertir cotización');
        }
    });
}

export function useMarkQuoteAccepted() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (id: string) => deleteQuote(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['quotes', user?.tenantId] });
        },
        onError: (error: any) => {
            console.error('Error deleting presale after payment:', error);
        },
    });
}

export function useDeleteQuote() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (id: string) => deleteQuote(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['quotes', user?.tenantId] });
        },
        onError: (error: any) => {
            console.error('Error deleting quote:', error);
            toast.error('Error al eliminar la preventa');
        },
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
