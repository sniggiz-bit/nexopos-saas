
import { apiClient } from './client';
import type { StockMovement } from './types';

export async function getKardex(productId: string, branchId?: string): Promise<StockMovement[]> {
    const response = await apiClient.get<StockMovement[]>(`/inventory/kardex/${productId}`, {
        params: branchId ? { branchId } : undefined,
    });
    return response.data;
}
