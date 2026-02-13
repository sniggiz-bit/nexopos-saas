import { apiClient } from './client';

export interface DashboardStats {
    totalProducts: number;
    salesToday: number;
    monthRevenue: number;
    lowStockCount: number;
}

export async function getDashboardStats(tenantId: string, branchId: string = 'branch-1'): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
        params: { tenantId, branchId },
    });
    return response.data;
}
