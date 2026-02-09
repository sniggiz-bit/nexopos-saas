import { apiClient } from './client';

export interface SaleItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface CreateSaleRequest {
    items: SaleItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod?: string;
    customerName?: string;
    customerRut?: string;
}

export interface Sale {
    id: string;
    tenantId: string;
    userId: string;
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    paymentMethod?: string;
    customerName?: string;
    customerRut?: string;
    createdAt: string;
    updatedAt: string;
    items: SaleItem[];
}

/**
 * Create a new sale
 */
export async function createSale(saleData: CreateSaleRequest): Promise<Sale> {
    const response = await apiClient.post<Sale>('/sales', saleData);
    return response.data;
}

/**
 * Get all sales
 */
export async function getSales(): Promise<Sale[]> {
    const response = await apiClient.get<Sale[]>('/sales');
    return response.data;
}

/**
 * Get a single sale by ID
 */
export async function getSale(id: string): Promise<Sale> {
    const response = await apiClient.get<Sale>(`/sales/${id}`);
    return response.data;
}
