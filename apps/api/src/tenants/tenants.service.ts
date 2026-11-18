import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { effectiveModuleCodes, FEATURE_MODULES, moduleTenantInclude } from '../modules/module-access';
import { Prisma } from '@prisma/client';

import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Creates a new tenant along with its default branch, admin user,
   * and TenantSettings — all within a single atomic database transaction.
   */
  async createWithDefaults(data: {
    tenant: Prisma.TenantCreateInput;
    admin: Omit<Prisma.UserCreateInput, 'tenant' | 'branch'>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: data.tenant,
      });

      // 2. Create default Branch (Casa Matriz)
      const branch = await tx.branch.create({
        data: {
          name: 'Casa Matriz',
          isMain: true,
          isActive: true,
          tenantId: tenant.id,
        },
      });

      // 3. Create User (ADMIN role)
      const user = await tx.user.create({
        data: {
          ...(data.admin as any),
          tenantId: tenant.id,
          branchId: branch.id,
        },
      });

      // 4. Create TenantSettings with secure defaults
      const settings = await (tx as any).tenantSettings.create({
        data: {
          tenantId: tenant.id,
          // DTE modules disabled by default — must be activated by Super Admin
          enableBoletaDte: false,
          enableFacturaDte: false,
          enableGuiaDespachoDte: false,
          enableNotaCreditoDte: false,
          // Base resource limits
          maxBranches: 1,
          maxRegisters: 1,
          maxUsers: 3,
          // No destructive permissions by default
          canHardDelete: false,
        },
      });

      return { tenant, branch, user, settings };
    });
  }

  async findAll(search?: string): Promise<any[]> {
    return this.prisma.tenant.findMany({
      where: search
        ? {
          name: { contains: search, mode: 'insensitive' },
        }
        : {},
      include: {
        plan: true,
        settings: true,
        users: {
          where: { role: 'TENANT_ADMIN' },
          take: 1,
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { users: true, branches: true },
        },
      } as any,
      orderBy: { createdAt: 'desc' },
    } as any);
  }

  async findOne(id: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        ...moduleTenantInclude, branches: true,
        users: { select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true, createdAt: true } },
        dteConfig: { select: { id: true, tenantId: true, liorenLogo: true, dteResolution: true, resolutionDate: true } },
        _count: { select: { users: true, branches: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    const codes = new Set(effectiveModuleCodes(tenant));
    const effective = Object.fromEntries(Object.entries(FEATURE_MODULES).map(([flag, modules]) => [flag, modules.some(code => codes.has(code))]));
    return { ...tenant, settings: { ...tenant.settings, ...effective } };
  }

  /**
   * Updates TenantSettings for a given tenant (upsert for resilience).
   * Intended for Super Admin use only.
   */
  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto, actorId?: string) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    return this.prisma.$transaction(async tx => {
      const updated = await tx.tenantSettings.upsert({ where: { tenantId }, create: { tenantId, ...dto }, update: { ...dto } });
      if (actorId) await tx.systemLog.create({ data: { tenantId, level: 'INFO', message: 'CLIENT_ADMIN_ACTION', context: { actorId, action: 'LIMITS_UPDATED' } } });
      return updated;
    });
  }

  async suspend(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
  }

  async activate(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async updatePlan(id: string, planId: string | null, actorId?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenant.update({
        where: { id },
        data: { planId },
        include: { plan: true },
      });

      if (planId && updatedTenant.plan) {
        const plan = updatedTenant.plan;
        const features = (plan.enabledFeatures as Record<string, any>) || {};

        const dataToUpdate: any = {
          maxUsers: plan.maxUsers,
        };
        if (typeof features.enableEcommerce === 'boolean') dataToUpdate.enableEcommerce = features.enableEcommerce;
        if (typeof features.enableTransbank === 'boolean') dataToUpdate.enableTransbank = features.enableTransbank;
        if (typeof features.enableIntegrations === 'boolean') dataToUpdate.enableIntegrations = features.enableIntegrations;

        await (tx as any).tenantSettings.upsert({
          where: { tenantId: id },
          create: {
            tenantId: id,
            ...dataToUpdate
          },
          update: dataToUpdate
        });
      }

      if (actorId) await tx.systemLog.create({ data: { tenantId: id, level: 'INFO', message: 'CLIENT_ADMIN_ACTION', context: { actorId, action: 'PLAN_UPDATED', planId } } });
      return updatedTenant;
    });
  }

  async updateBasic(id: string, data: { name: string; phone?: string; rut?: string; giro?: string; address?: string; logoUrl?: string }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async changePlanSimulate(id: string, planId: string | null) {
    // Update plan and settings limits first
    await this.updatePlan(id, planId);

    // Set simulated billing status as ACTIVE and set next payment to 30 days from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        billingStatus: 'ACTIVE',
        nextPayment: nextDate,
      },
      include: {
        plan: true,
        settings: true,
      } as any,
    });
  }
}
