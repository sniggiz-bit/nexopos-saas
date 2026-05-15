import { apiClient } from './client';

export interface DashboardStats {
    totalProducts: number;
    totalSuppliers: number;
    totalBranches: number;
    totalCustomers: number;
    totalQuotes: number;
    salesToday: number;
    monthRevenue: number;
    lowStockCount: number;
}

export interface DashboardAnalytics {
    salesByHour: { hour: number; total: number }[];
    topProducts: { id: string; name: string; qty: number; revenue: number }[];
    monthComparison: { currentRevenue: number; prevRevenue: number; pctChange: number | null };
}

export async function getDashboardStats(branchId?: string): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
        params: { branchId },
    });
    return response.data;
}

export async function getDashboardAnalytics(branchId?: string): Promise<DashboardAnalytics> {
    const response = await apiClient.get<DashboardAnalytics>('/dashboard/analytics', {
        params: { branchId },
    });
    return response.data;
}
