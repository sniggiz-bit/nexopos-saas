import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from './use-toast';

export interface Branch {
    id: string;
    name: string;
    address?: string;
    isMain: boolean;
    isActive: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export function useBranches() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchBranches = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await api.get('/branches');
            setBranches(response.data);
        } catch (error: any) {
            console.error('Error fetching branches:', error);
            const message = error.response?.data?.message || 'No se pudieron cargar las sucursales.';
            if (!silent) toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchBranches();
        const refresh = () => { if (document.visibilityState === 'visible') fetchBranches(true); };
        const timer = window.setInterval(refresh, 30000);
        window.addEventListener('focus', refresh);
        return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
    }, [fetchBranches]);

    return { branches, loading, fetchBranches };
}
