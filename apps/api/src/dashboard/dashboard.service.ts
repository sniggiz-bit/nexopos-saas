import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, startOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(tenantId: string, branchId: string = 'branch-1') {
        const today = startOfDay(new Date());
        const firstDayOfMonth = startOfMonth(new Date());

        // 1. Total Products (Active)
        const totalProducts = await this.prisma.product.count({
            where: {
                tenantId,
                isActive: true,
            },
        });

        // 2. Sales Today (Sum of totals)
        const salesTodayResult = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                branchId,
                status: 'COMPLETED',
                createdAt: {
                    gte: today,
                },
            },
            _sum: {
                total: true,
            },
        });
        const salesToday = Number(salesTodayResult._sum.total || 0);

        // 3. Month Revenue
        const monthRevenueResult = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                branchId,
                status: 'COMPLETED',
                createdAt: {
                    gte: firstDayOfMonth,
                },
            },
            _sum: {
                total: true,
            },
        });
        const monthRevenue = Number(monthRevenueResult._sum.total || 0);

        // 4. Low Stock Count
        // We need to check products where calculated stock <= minStock
        // This is a bit complex for a single query with Prisma's current state since stock is derived from InventoryLevel
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            include: {
                inventory: {
                    where: { branchId },
                },
            },
        });

        const lowStockCount = products.filter(product => {
            const stock = product.inventory.reduce(
                (total, inv) => total + Number(inv.quantity),
                0,
            );
            return stock <= product.minStock;
        }).length;

        return {
            totalProducts,
            salesToday,
            monthRevenue,
            lowStockCount,
        };
    }
}
