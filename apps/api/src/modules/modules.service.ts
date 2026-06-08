import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.module.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async updateModule(id: string, data: { price: number }) {
    return this.prisma.module.update({
      where: { id },
      data: { price: data.price }
    });
  }

  async getModulesForTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: {
          include: { planModules: { include: { module: true } } }
        },
        tenantModuleAddons: {
          include: { module: true }
        }
      }
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const planModules = tenant.plan?.planModules.map(pm => pm.module) || [];
    const addonModules = tenant.tenantModuleAddons.map(tma => tma.module);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        rut: tenant.rut,
        status: tenant.status
      },
      planModules,
      addonModules,
      allActive: [...new Map([...planModules, ...addonModules].map(m => [m.id, m])).values()]
    };
  }

  async setTenantAddons(tenantId: string, moduleIds: string[]) {
    // Determine which modules are already active in the plan to avoid duplicates
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: { include: { planModules: true } } }
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const planModuleIds = tenant.plan?.planModules.map(pm => pm.moduleId) || [];
    const filteredAddons = moduleIds.filter(id => !planModuleIds.includes(id));

    // Transaction to replace addons
    return this.prisma.$transaction(async (tx) => {
      await tx.tenantModuleAddon.deleteMany({
        where: { tenantId }
      });

      if (filteredAddons.length > 0) {
        await tx.tenantModuleAddon.createMany({
          data: filteredAddons.map(moduleId => ({
            tenantId,
            moduleId
          }))
        });
      }

      return tx.tenantModuleAddon.findMany({
        where: { tenantId },
        include: { module: true }
      });
    });
  }
}
