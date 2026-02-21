import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(tenantId: string, branchId?: string): Promise<{
        totalProducts: number;
        salesToday: number;
        monthRevenue: number;
        lowStockCount: number;
    }>;
}
