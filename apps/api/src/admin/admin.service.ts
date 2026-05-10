import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);

    const [totalTenants, activeTenants, suspendedTenants, newThisMonth, activeUsers, planDist] =
      await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.user.count({ where: { updatedAt: { gte: startOfDay } } }),
        this.prisma.tenant.groupBy({
          by: ['planId'],
          _count: { id: true },
        }),
      ]);

    const plans = await this.prisma.plan.findMany({ select: { id: true, name: true, price: true } });
    const planMap = Object.fromEntries(plans.map(p => [p.id, p]));

    const planDistribution = planDist.map(d => ({
      planId: d.planId,
      name: planMap[d.planId as string]?.name ?? 'Sin plan',
      price: planMap[d.planId as string]?.price ?? 0,
      count: d._count.id,
    }));

    const mrr = planDistribution.reduce((s, p) => s + p.price * p.count, 0);

    return { totalTenants, activeTenants, suspendedTenants, newThisMonth, mrr, activeUsers, planDistribution };
  }

  async getTenantMetrics(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [salesThisMonth, productsCount, usersCount, branchesCount, lastSale] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: { tenantId, createdAt: { gte: startOfMonth } },
          _count: { id: true },
          _sum: { total: true },
        }),
        this.prisma.product.count({ where: { tenantId, isActive: true } }),
        this.prisma.user.count({ where: { tenantId } }),
        this.prisma.branch.count({ where: { tenantId } }),
        this.prisma.sale.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      salesThisMonth: salesThisMonth._count.id,
      revenueThisMonth: Number(salesThisMonth._sum.total ?? 0),
      productsCount,
      usersCount,
      branchesCount,
      lastActivity: lastSale?.createdAt ?? null,
    };
  }

  async getTenants(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { rut: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip, take: limit, where,
        include: {
          plan: { select: { id: true, name: true, price: true } },
          settings: true,
          users: { where: { role: 'TENANT_ADMIN' }, take: 1, select: { id: true, name: true, email: true } },
          _count: { select: { branches: true, users: true, products: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants.map(t => ({ ...t, owner: t.users[0] ?? { id: null, name: 'Sin admin', email: 'N/A' } })),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async toggleTenantStatus(id: string, status: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async getLandingConfig() {
    const record = await this.prisma.landingConfig.findUnique({ where: { id: 'singleton' } });
    return record?.data ?? null;
  }

  async updateLandingConfig(data: Record<string, any>) {
    return this.prisma.landingConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', data },
      update: { data },
    });
  }
}
