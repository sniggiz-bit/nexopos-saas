/**
 * Sales Service
 *
 * Encapsulates all business logic for the sales analytics module.
 * Consumes `VITE_API_URL/api/sales` via the shared Axios apiClient.
 */

import { apiClient } from '../api/client';

// ─────────────────────────────────────────────
// Strict TypeScript types
// ─────────────────────────────────────────────

export type SaleStatus = 'COMPLETED' | 'PRE_SALE' | 'CANCELLED';

export type PaymentMethodKey =
    | 'EFECTIVO'
    | 'CREDITO'
    | 'TRANSFERENCIA'
    | 'DEBITO'
    | string;

export interface SalePayment {
    id: string;
    amount: number;
    paymentMethod: PaymentMethodKey;
}

export interface SaleItem {
    id: string;
    quantity: number;
    price: number;
    product: {
        id: string;
        name: string;
        sku?: string;
    };
}

export interface SaleBranch {
    id: string;
    name: string;
}

export interface SaleUser {
    id: string;
    name?: string | null;
    email: string;
}

export interface SaleCustomer {
    id: string;
    name: string;
    rut: string;
}

/** Full Sale record returned by the API */
export interface SaleRecord {
    id: string;
    tenantId: string;
    branchId: string;
    userId?: string;
    total: number;
    status: SaleStatus;
    dteFolio?: number | null;
    dteStatus?: string | null;
    dtePdfUrl?: string | null;
    internalReceiptUrl?: string | null;
    createdAt: string;
    updatedAt: string;
    items?: SaleItem[];
    payments?: SalePayment[];
    branch?: SaleBranch;
    user?: SaleUser;
    customer?: SaleCustomer;
}

/** Query parameters supported by GET /api/sales */
export interface SalesFilters {
    startDate?: string;   // ISO-8601 date string e.g. "2025-01-01"
    endDate?: string;     // ISO-8601 date string e.g. "2025-12-31"
    branchId?: string;
    status?: SaleStatus;
}

/** Paginated response shape (future-proof) */
export interface SalesResponse {
    data: SaleRecord[];
    total?: number;
    page?: number;
    limit?: number;
}

// ─────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────

/**
 * Fetch the list of sales, optionally filtered by date range or branch.
 * Endpoint: GET VITE_API_URL/api/sales
 */
export async function fetchSales(filters?: SalesFilters): Promise<SaleRecord[]> {
    const response = await apiClient.get<SaleRecord[] | SalesResponse>('/sales', {
        params: filters,
    });

    // Handle both plain array and paginated response shapes
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return (response.data as SalesResponse).data ?? [];
}

/**
 * Fetch a single sale by its ID.
 * Endpoint: GET VITE_API_URL/api/sales/:id
 */
export async function fetchSale(id: string): Promise<SaleRecord> {
    const response = await apiClient.get<SaleRecord>(`/sales/${id}`);
    return response.data;
}

/**
 * Void / cancel a sale.
 * Endpoint: POST VITE_API_URL/api/sales/:id/cancel
 */
export async function cancelSale(id: string): Promise<SaleRecord> {
    const response = await apiClient.post<SaleRecord>(`/sales/${id}/cancel`);
    return response.data;
}

// ─────────────────────────────────────────────
// Display helpers (pure, no side-effects)
// ─────────────────────────────────────────────

/** Map raw paymentMethod keys to Spanish display labels */
export function formatPaymentMethods(payments?: SalePayment[]): string {
    if (!payments || payments.length === 0) return '—';

    const labels: Record<string, string> = {
        EFECTIVO: 'Efectivo',
        CREDITO: 'Crédito',
        DEBITO: 'Débito',
        TRANSFERENCIA: 'Transferencia',
        // legacy English keys (just in case)
        CASH: 'Efectivo',
        CARD: 'Tarjeta',
        TRANSFER: 'Transferencia',
    };

    return payments
        .map((p) => labels[p.paymentMethod] ?? p.paymentMethod)
        .join(', ');
}

/** ISO date string → "dd/mm/yyyy HH:MM" in es-CL locale */
export function formatSaleDate(dateString: string): string {
    return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

/** Number → Chilean peso currency string */
export function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
    }).format(amount);
}

/** Resolve which PDF URL to open for a given sale */
export function resolvePdfUrl(sale: SaleRecord): string | null {
    if (sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock')) {
        return sale.dtePdfUrl;
    }
    return sale.internalReceiptUrl ?? null;
}
