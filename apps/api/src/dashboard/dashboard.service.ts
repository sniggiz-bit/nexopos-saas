import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, startOfMonth, subMonths } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getStats(tenantId: string, branchId: string = 'branch-1') {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
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
        dteType: { not: 61 },
        createdAt: {
          gte: today,
          lte: todayEnd,
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
        dteType: { not: 61 },
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
    const lowStockResult = await this.prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int AS count
      FROM "Product" p
      LEFT JOIN "InventoryLevel" i ON p.id = i."productId" AND i."branchId" = ${branchId}
      WHERE p."tenantId" = ${tenantId}
        AND p."isActive" = true
        AND COALESCE(i.quantity, 0) <= p."minStock"
    `;
    const lowStockCount = Number(lowStockResult[0]?.count || 0);

    // 5. Total Suppliers
    const totalSuppliers = await this.prisma.supplier.count({
      where: { tenantId },
    });

    // 6. Total Branches
    const totalBranches = await this.prisma.branch.count({
      where: { tenantId, isActive: true },
    });

    // 7. Total Customers
    const totalCustomers = await this.prisma.customer.count({
      where: { tenantId },
    });

    // 8. Total Quotes
    const totalQuotes = await this.prisma.quote.count({
      where: { tenantId },
    });

    return {
      totalProducts,
      totalSuppliers,
      totalBranches,
      totalCustomers,
      totalQuotes,
      salesToday,
      monthRevenue,
      lowStockCount,
    };
  }

  async getAnalytics(tenantId: string, branchId?: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = new Date(currentMonthStart.getTime() - 1);

    const bid = branchId && branchId !== 'branch-1' ? branchId : undefined;

    // Sales by hour for today
    const hourlySales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        branchId: bid,
        status: 'COMPLETED',
        dteType: { not: 61 },
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: { createdAt: true, total: true },
    });

    const salesByHour: { hour: number; total: number }[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0 }));
    for (const sale of hourlySales) {
      const h = new Date(sale.createdAt).getHours();
      salesByHour[h].total += Number(sale.total);
    }

    // Top 5 products this month by quantity sold
    const topProducts = await this.prisma.$queryRaw<
      { id: string; name: string; qty: number; revenue: number }[]
    >`
      SELECT 
        si."productId" AS id,
        p.name AS name,
        SUM(si.quantity)::float AS qty,
        SUM(si.price * si.quantity::float - si."discountAmount")::float AS revenue
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s.id
      JOIN "Product" p ON si."productId" = p.id
      WHERE s."tenantId" = ${tenantId}
        AND (${bid ? bid : null}::text IS NULL OR s."branchId" = ${bid ? bid : null})
        AND s.status = 'COMPLETED'
        AND s."dteType" <> 61
        AND s."createdAt" >= ${currentMonthStart}
      GROUP BY si."productId", p.name
      ORDER BY qty DESC
      LIMIT 5
    `;

    // Month comparison
    const [currentRevResult, prevRevResult] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          tenantId,
          branchId: bid,
          status: 'COMPLETED',
          dteType: { not: 61 },
          createdAt: { gte: currentMonthStart },
        },
        _sum: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: {
          tenantId,
          branchId: bid,
          status: 'COMPLETED',
          dteType: { not: 61 },
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { total: true },
      }),
    ]);

    const currentRevenue = Number(currentRevResult._sum.total ?? 0);
    const prevRevenue = Number(prevRevResult._sum.total ?? 0);
    const pctChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : null;

    return {
      salesByHour,
      topProducts,
      monthComparison: { currentRevenue, prevRevenue, pctChange },
    };
  }
}
