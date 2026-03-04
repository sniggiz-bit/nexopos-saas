import { apiClient } from './client';
import type { Supplier } from './suppliers';

export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseItem {
    id: string;
    productId: string;
    quantity: number;
    costPrice: number;
    product?: {
        id: string;
        name: string;
        sku?: string;
    };
}

export interface Purchase {
    id: string;
    date: string;
    totalAmount: number;
    status: PurchaseStatus;
    supplierId?: string;
    branchId: string;
    tenantId: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    supplier?: Pick<Supplier, 'id' | 'name'>;
    branch?: { id: string; name: string };
    items?: PurchaseItem[];
    _count?: { items: number };
}

export interface CreatePurchaseItemData {
    productId: string;
    quantity: number;
    costPrice: number;
}

export interface CreatePurchaseData {
    supplierId?: string;
    branchId: string;
    notes?: string;
    items: CreatePurchaseItemData[];
}

export async function getPurchases(branchId?: string): Promise<Purchase[]> {
    const response = await apiClient.get<Purchase[]>('/purchases', {
        params: branchId ? { branchId } : undefined,
    });
    return response.data;
}

export async function getPurchase(id: string): Promise<Purchase> {
    const response = await apiClient.get<Purchase>(`/purchases/${id}`);
    return response.data;
}

export async function createPurchase(data: CreatePurchaseData): Promise<Purchase> {
    const response = await apiClient.post<Purchase>('/purchases', data);
    return response.data;
}
