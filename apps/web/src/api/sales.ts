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
    status: 'COMPLETED' | 'PRE_SALE' | 'CANCELLED' | 'PENDING_CREDIT_NOTE' | 'CREDIT_NOTE';
    originalSaleId?: string | null;
    dteVerifiedAt?: string | null;
    dteProviderId?: string | null;
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
export async function emitNotaCredito(id: string): Promise<{ success: boolean; folio?: number; url_pdf?: string; status?: string; error?: string; noteId?: string }> {
    const response = await apiClient.post(`/sales/${id}/nota-credito`, {}, { timeout: 90000 });
    return response.data;
}

export async function sendSaleReceiptEmail(id: string, email: string): Promise<void> {
    await apiClient.post(`/sales/${id}/send-email`, { email });
}

export async function deleteInternalSale(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/sales/${id}`);
    return response.data;
}



export interface CreditNotePreview {
    sale: { id: string; type: number; folio: number | null; total: number; createdAt: string; branchName: string | null };
    existingNote: { id: string; folio: number | null; status: string; dteStatus: string; canVerify: boolean } | null;
    canEmit: boolean;
    message: string;
}
export async function getCreditNotePreview(id: string, signal?: AbortSignal): Promise<CreditNotePreview> {
    return (await apiClient.get('/sales/' + id + '/nota-credito', { signal, timeout: 60000 })).data;
}
export async function verifySaleDte(id: string): Promise<{ success: boolean; status: string; error?: string }> {
    return (await apiClient.post('/sales/' + id + '/dte/verify', {}, { timeout: 30000 })).data;
}
