import { useState } from 'react';
import { api } from '../lib/api';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export interface TransferItem {
    productId: string;
    quantity: number;
}

export interface CreateTransferData {
    originBranchId: string;
    destBranchId: string;
    items: TransferItem[];
    note?: string;
}

export function useTransfers() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const createTransfer = async (data: CreateTransferData) => {
        try {
            setLoading(true);
            const response = await api.post('/transfers', data);
            toast({
                title: 'Transferencia Exitosa',
                description: 'El inventario ha sido actualizado correctamente.',
            });
            navigate('/admin/branches'); // Redirect to branches or transfers list
            return response.data;
        } catch (error: any) {
            console.error('Error creating transfer:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo realizar la transferencia.',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { createTransfer, loading };
}
