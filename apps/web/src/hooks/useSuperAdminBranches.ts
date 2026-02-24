import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useToast } from './use-toast';

export interface SystemBranch {
    id: string;
    name: string;
    address?: string;
    isMain: boolean;
    isActive: boolean;
    tenantId: string;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
    };
}

export function useSuperAdminBranches() {
    const [branches, setBranches] = useState<SystemBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchBranches = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/branches/system');
            setBranches(response.data);
        } catch (error: any) {
            console.error('Error fetching system branches:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar todas las sucursales.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const toggleBranchStatus = async (id: string, isActive: boolean) => {
        try {
            await api.patch(`/branches/${id}/status`, { isActive });

            // Optimistic update
            setBranches(prev => prev.map(b =>
                b.id === id ? { ...b, isActive } : b
            ));

            toast({
                title: 'Éxito',
                description: `Sucursal ${isActive ? 'activada' : 'desactivada'} correctamente.`,
            });
        } catch (error: any) {
            console.error('Error updating branch status:', error);
            toast({
                title: 'Error',
                description: 'No se pudo cambiar el estado de la sucursal.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    return { branches, loading, fetchBranches, toggleBranchStatus };
}
