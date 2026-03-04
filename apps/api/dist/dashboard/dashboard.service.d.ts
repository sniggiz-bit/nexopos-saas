import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
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
