
import { apiClient } from './client';
import type { Quote } from './types';

export interface CreateQuoteItemData {
    productId: string;
    productName?: string;
    quantity: number;
    price: number;
    discount?: number;
}

export interface CreateQuoteData {
    tenantId: string;
    customerId?: string;
    userId?: string;
    issueDate?: string;
    validUntil?: string;
    notes?: string;
    items: CreateQuoteItemData[];
}

export async function getQuotes(tenantId: string = 'tenant-1'): Promise<Quote[]> {
    const response = await apiClient.get<Quote[]>('/quotes', { params: { tenantId } });
    return response.data;
}

export async function getQuote(id: string): Promise<Quote> {
    const response = await apiClient.get<Quote>(`/quotes/${id}`);
    return response.data;
}

export async function createQuote(data: CreateQuoteData): Promise<Quote> {
    const response = await apiClient.post<Quote>('/quotes', data);
    return response.data;
}

export async function updateQuote(id: string, data: Partial<CreateQuoteData>): Promise<Quote> {
    const response = await apiClient.patch<Quote>(`/quotes/${id}`, data);
    return response.data;
}

export async function convertQuote(id: string): Promise<any> {
    const response = await apiClient.post(`/quotes/${id}/convert`);
    return response.data;
}

export async function generateQuotePdf(id: string): Promise<Blob> {
    const response = await apiClient.get(`/quotes/${id}/pdf`, { responseType: 'blob' });
    return response.data;
}
