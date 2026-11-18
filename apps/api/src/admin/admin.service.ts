import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private events: EventsGateway) {}

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

  async getTenants(page = 1, limit = 15, search?: string, status?: string) {
    page = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    limit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 15;
    if (status && !['ACTIVE', 'SUSPENDED'].includes(status)) throw new BadRequestException('Estado de cliente inválido.');
    const term = search?.trim().slice(0, 200);
    const where = {
      ...(status ? { status } : {}),
      ...(term ? { OR: [
        { name: { contains: term, mode: 'insensitive' as const } },
        { rut: { contains: term, mode: 'insensitive' as const } },
        { users: { some: { OR: [{ email: { contains: term, mode: 'insensitive' as const } }, { name: { contains: term, mode: 'insensitive' as const } }] } } },
      ] } : {}),
    };
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip: (page - 1) * limit, take: limit, where,
        include: {
          plan: { select: { id: true, name: true, price: true } },
          branches: { select: { isActive: true } },
          users: { where: { role: { in: ['TENANT_ADMIN', 'SUPER_ADMIN'] } }, take: 1, orderBy: [{ role: 'desc' }, { isActive: 'desc' }, { createdAt: 'asc' }], select: { id: true, name: true, email: true, role: true, isActive: true } },
          _count: { select: { branches: true, users: true, products: true } },
        }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return {
      data: tenants.map(({ branches, users, ...tenant }) => ({ ...tenant,
        activeBranches: branches.filter(b => b.isActive).length,
        owner: users[0] || { id: null, name: 'Sin administrador', email: '' },
      })), total, page, lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }
  async toggleTenantStatus(id: string, status: string, actorId?: string) {
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) throw new BadRequestException('Estado inválido.');
    const updated = await this.prisma.$transaction(async tx => {
      const tenant = await tx.tenant.findUnique({ where: { id }, include: { users: { where: { role: 'SUPER_ADMIN' }, select: { id: true } } } });
      if (!tenant) throw new NotFoundException('Empresa no encontrada.');
      if (tenant.users.length) throw new ForbiddenException('Esta cuenta contiene administradores de la plataforma y está protegida.');
      const result = await tx.tenant.update({ where: { id }, data: { status } });
      await tx.systemLog.create({ data: { tenantId: id, level: 'INFO', message: 'CLIENT_ADMIN_ACTION', context: { actorId: actorId || 'superadmin', action: 'STATUS_UPDATED', status } } });
      return result;
    });
    this.events.revokeTenant(id);
    return updated;
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
