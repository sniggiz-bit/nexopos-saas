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
    const [loadFailed, setLoadFailed] = useState(false);
    const [pendingIds, setPendingIds] = useState(() => new Set<string>());
    const { toast } = useToast();

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<SystemBranch[]>('/branches/system');
            setBranches(response.data);
            setLoadFailed(false);
        } catch (error) {
            console.error('Error fetching system branches:', error);
            setLoadFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleBranchStatus = async (id: string, isActive: boolean) => {
        setPendingIds(previous => new Set(previous).add(id));
        try {
            await api.patch(`/branches/${id}/status`, { isActive });

            setBranches(prev => prev.map(b =>
                b.id === id ? { ...b, isActive } : b
            ));

            toast({
                title: 'Éxito',
                description: `Sucursal ${isActive ? 'activada' : 'desactivada'} correctamente.`,
            });
        } catch (error) {
            console.error('Error updating branch status:', error);
            toast({
                title: 'Error',
                description: 'No se pudo cambiar el estado de la sucursal.',
                variant: 'destructive',
            });
        } finally {
            setPendingIds(previous => {
                const remaining = new Set(previous);
                remaining.delete(id);
                return remaining;
            });
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    return { branches, loading, loadFailed, fetchBranches, pendingIds, toggleBranchStatus };
}
