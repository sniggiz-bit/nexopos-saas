import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        branches: true,
        users: true,
        settings: true,
      } as any,
    });
  }

  /**
   * Updates TenantSettings for a given tenant (upsert for resilience).
   * Intended for Super Admin use only.
   */
  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    return (this.prisma as any).tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: { ...dto },
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
}
