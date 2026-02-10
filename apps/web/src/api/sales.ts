import { apiClient } from './client';

export const PaymentMethod = {
    CASH: 'CASH',
    CARD: 'CARD',
    TRANSFER: 'TRANSFER',
    DEBIT: 'DEBIT',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];


export interface SaleItem {
    productId: string;
    quantity: number;
}

export interface CreateSaleRequest {
    tenantId: string;
    branchId: string;
    userId?: string;
    items: SaleItem[];
    paymentMethod: PaymentMethod;
}


export interface Sale {
    id: string;
    tenantId: string;
    branchId: string;
    userId?: string;
    total: number;
    paymentMethod: PaymentMethod;
    dteFolio?: number;
    dteStatus?: string;
    createdAt: string;
    updatedAt: string;
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
