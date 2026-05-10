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

    const lowStockCount = products.filter((product) => {
      const stock = product.inventory.reduce(
        (total, inv) => total + Number(inv.quantity),
        0,
      );
      return stock <= product.minStock;
    }).length;

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

    const branchFilter = branchId && branchId !== 'branch-1' ? { branchId } : {};

    // Sales by hour for today (raw query for grouping)
    const hourlySales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        ...branchFilter,
        status: 'COMPLETED',
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
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          tenantId,
          ...branchFilter,
          status: 'COMPLETED',
          createdAt: { gte: currentMonthStart },
        },
      },
      select: {
        quantity: true,
        subtotal: true,
        product: { select: { id: true, name: true } },
      },
    });

    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const item of saleItems) {
      if (!item.product) continue;
      const existing = productMap.get(item.product.id) ?? { name: item.product.name, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += Number(item.subtotal);
      productMap.set(item.product.id, existing);
    }

    const topProducts = [...productMap.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Month comparison
    const [currentRevResult, prevRevResult] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { tenantId, ...branchFilter, status: 'COMPLETED', createdAt: { gte: currentMonthStart } },
        _sum: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, ...branchFilter, status: 'COMPLETED', createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
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
