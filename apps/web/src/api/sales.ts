import { apiClient } from './client';

export const PaymentMethod = {
    CASH: 'EFECTIVO',
    CARD: 'CREDITO',
    TRANSFER: 'TRANSFERENCIA',
    DEBIT: 'DEBITO',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];



export interface SaleItem {
    productId: string;
    quantity: number;
    /** Override the catalog price for this line item (e.g. after a manual price edit) */
    price?: number;
    /** Total discount in CLP for this line (computed from PERCENTAGE or FIXED discount) */
    discountAmount?: number;
}

export interface PaymentRequestData {
    paymentMethod: string;
    amount: number;
}

export interface CreateSaleRequest {
    tenantId: string;
    branchId: string;
    userId?: string;
    items: SaleItem[];
    payments: PaymentRequestData[];
    status?: 'COMPLETED' | 'PRE_SALE';
    customerId?: string;
    quoteId?: string;
    dteType?: number;
}


export interface Sale {
    id: string;
    tenantId: string;
    branchId: string;
    userId?: string;
    total: number;
    discountAmount?: number;
    status: 'COMPLETED' | 'PRE_SALE' | 'CANCELLED';
    dteFolio?: number;
    dteStatus?: string;
    dteType?: number;        // 39=Boleta, 33=Factura, 61=NotaCredito, 52=GuiaDespacho
    dtePdfUrl?: string;
    internalReceiptUrl?: string;
    createdAt: string;
    updatedAt: string;
    items?: {
        id: string;
        quantity: number;
        price: number;
        discountAmount?: number;
        product: {
            id: string;
            name: string;
            sku?: string;
        };
    }[];
    payments?: {
        id: string;
        amount: number;
        paymentMethod: string;
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
    customer?: {
        id: string;
        name: string;
        rut: string;
    };
}

export interface GetSalesParams {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    tenantId?: string;
}


/**
 * Create a new sale
 */
export async function createSale(saleData: CreateSaleRequest): Promise<Sale> {
    const response = await apiClient.post<Sale>('/sales', saleData);
    return response.data;
}

/**
 * Complete a pre-sale
 */
export async function completeSale(id: string, payments: PaymentRequestData[]): Promise<Sale> {
    const response = await apiClient.post<Sale>(`/sales/${id}/complete`, payments);
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

/**
 * Emit a Nota de Crédito for an existing completed sale
 */
export async function emitNotaCredito(id: string): Promise<{ success: boolean; folio?: number; url_pdf?: string; error?: string }> {
    const response = await apiClient.post(`/sales/${id}/nota-credito`);
    return response.data;
}

