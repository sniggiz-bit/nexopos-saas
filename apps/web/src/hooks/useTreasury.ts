import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface ReceivablesData {
    total: number;
    count: number;
}

export interface CashFlowItem {
    method: string;
    amount: number;
}

export interface Credit {
    id: string;
    totalAmount: number;
    balance: number;
    status: string;
    dueDate: string | null;
    customer: {
        name: string;
    };
}

export function useTreasuryReceivables(tenantId: string) {
    return useQuery({
        queryKey: ['treasury', 'receivables', tenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<ReceivablesData>(`/treasury/receivables?tenantId=${tenantId}`);
            return data;
        },
    });
}

export function useTreasuryCashFlow(tenantId: string) {
    return useQuery({
        queryKey: ['treasury', 'cash-flow', tenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<CashFlowItem[]>(`/treasury/cash-flow?tenantId=${tenantId}`);
            return data;
        },
    });
}

export function useTreasuryMaturities(tenantId: string) {
    return useQuery({
        queryKey: ['treasury', 'maturities', tenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<Credit[]>(`/treasury/maturities?tenantId=${tenantId}`);
            return data;
        },
    });
}
