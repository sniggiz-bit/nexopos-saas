import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(tenantId: string, branchId?: string): Promise<{
        totalProducts: number;
        totalSuppliers: number;
        totalBranches: number;
        totalCustomers: number;
        totalQuotes: number;
        salesToday: number;
        monthRevenue: number;
        lowStockCount: number;
    }>;
}
