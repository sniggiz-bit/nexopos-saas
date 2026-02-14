import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from './use-toast';

export interface Branch {
    id: string;
    name: string;
    address?: string;
    isMain: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export function useBranches() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchBranches = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/branches');
            setBranches(response.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
            const message = error.response?.data?.message || 'No se pudieron cargar las sucursales.';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const createBranch = async (data: { name: string; address?: string; isMain?: boolean }) => {
        try {
            const response = await api.post('/branches', data);
            toast({
                title: 'Éxito',
                description: 'Sucursal creada correctamente.',
            });
            fetchBranches(); // Refresh list
            return response.data;
        } catch (error) {
            console.error('Error creating branch:', error);
            const message = error.response?.data?.message || 'No se pudo crear la sucursal.';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    return { branches, loading, fetchBranches, createBranch };
}
