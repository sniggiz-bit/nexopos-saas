
import { apiClient } from './client';
import type { Credit } from './types';

export interface CreateCreditData {
    tenantId: string;
    customerId: string;
    saleId?: string;
    totalAmount: number;
    balance: number;
}

export interface AddPaymentData {
    amount: number;
    paymentMethod: string;
    cashShiftId?: string;
}

export async function getCredits(tenantId: string = 'tenant-1', customerId?: string): Promise<Credit[]> {
    const params: any = { tenantId };
    if (customerId) params.customerId = customerId;

    const response = await apiClient.get<Credit[]>('/credits', { params });
    return response.data;
}

export async function getCredit(id: string): Promise<Credit> {
    const response = await apiClient.get<Credit>(`/credits/${id}`);
    return response.data;
}

export async function createCredit(data: CreateCreditData): Promise<Credit> {
    const response = await apiClient.post<Credit>('/credits', data);
    return response.data;
}

export async function addCreditPayment(id: string, data: AddPaymentData): Promise<Credit> {
    const response = await apiClient.post<Credit>(`/credits/${id}/pay`, data);
    return response.data;
}
