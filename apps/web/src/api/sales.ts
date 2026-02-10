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
    dtePdfUrl?: string;
    internalReceiptUrl?: string;
    createdAt: string;
    updatedAt: string;
    items?: {
        id: string;
        quantity: number;
        price: number;
        product: {
            id: string;
            name: string;
            sku?: string;
        };
    }[];
    branch?: {
        id: string;
        name: string;
    };
    user?: {
        id: string;
        name?: string;
        email: string;
    };
}

export interface GetSalesParams {
    startDate?: string;
    endDate?: string;
    branchId?: string;
}


/**
 * Create a new sale
 */
export async function createSale(saleData: CreateSaleRequest): Promise<Sale> {
    const response = await apiClient.post<Sale>('/sales', saleData);
    return response.data;
}

/**
 * Get all sales with optional filters
 */
export async function getSales(params?: GetSalesParams): Promise<Sale[]> {
    const response = await apiClient.get<Sale[]>('/sales', { params });
    return response.data;
}

/**
 * Get a single sale by ID
 */
export async function getSale(id: string): Promise<Sale> {
    const response = await apiClient.get<Sale>(`/sales/${id}`);
    return response.data;
}

