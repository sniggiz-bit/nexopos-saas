import { Prisma } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { effectiveModuleCodes, moduleTenantInclude } from './module-access';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}
  async findAll() { return this.prisma.module.findMany({ orderBy: { name: 'asc' } }); }
  async updateModule(id: string, data: { price: number }) {
    if (!Number.isInteger(data.price) || data.price < 0) throw new BadRequestException('Precio inválido.');
    return this.prisma.module.update({ where: { id }, data: { price: data.price } });
  }
  async getModulesForTenant(tenantId: string) {
    const [tenant, catalog] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId }, include: moduleTenantInclude }),
      this.findAll(),
    ]);
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    const codes = new Set(effectiveModuleCodes(tenant, catalog));
    const planModules = tenant.plan?.planModules.map(pm => pm.module) || [];
    const addonModules = tenant.tenantModuleAddons.map(a => a.module);
    return {
      tenant: { id: tenant.id, name: tenant.name, rut: tenant.rut, status: tenant.status },
      planModules, addonModules,
      overrides: tenant.moduleOverrides.map(o => ({ moduleId: o.moduleId, enabled: o.enabled })),
      catalog,
      inheritedCodes: effectiveModuleCodes({ ...tenant, moduleOverrides: [] }, catalog),
      allActive: catalog.filter(m => codes.has(m.code)),
    };
  }
  async setTenantAddons(tenantId: string, moduleIds: string[]) {
    if (!Array.isArray(moduleIds) || moduleIds.some(id => typeof id !== 'string')) throw new BadRequestException('Módulos inválidos.');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { plan: { include: { planModules: true } } } });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    const ids = [...new Set(moduleIds)];
    if (await this.prisma.module.count({ where: { id: { in: ids }, isActive: true } }) !== ids.length) throw new BadRequestException('Hay módulos inexistentes o deshabilitados.');
    const included = new Set(tenant.plan?.planModules.map(pm => pm.moduleId) || []);
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tenantModuleAddon.deleteMany({ where: { tenantId } });
      const addons = ids.filter(id => !included.has(id));
      if (addons.length) await tx.tenantModuleAddon.createMany({ data: addons.map(moduleId => ({ tenantId, moduleId })) });
      return tx.tenantModuleAddon.findMany({ where: { tenantId }, include: { module: true } });
    });
  }
  async setTenantAccess(tenantId: string, overrides: Array<{ moduleId: string; enabled: boolean | null }>, actorId: string) {
    if (!Array.isArray(overrides) || overrides.length > 200 ||
        overrides.some(o => !o || typeof o.moduleId !== 'string' || ![true, false, null].includes(o.enabled)) ||
        new Set(overrides.map(o => o.moduleId)).size !== overrides.length) throw new BadRequestException('Selección de módulos inválida.');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    const catalog = await this.findAll();
    if (overrides.some(o => !catalog.some(m => m.id === o.moduleId) ||
        (o.enabled === true && !catalog.find(m => m.id === o.moduleId)?.isActive))) throw new BadRequestException('Módulo inexistente o deshabilitado globalmente.');
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const o of overrides) {
        if (o.enabled === null) await tx.tenantModuleOverride.deleteMany({ where: { tenantId, moduleId: o.moduleId } });
        else await tx.tenantModuleOverride.upsert({
          where: { tenantId_moduleId: { tenantId, moduleId: o.moduleId } },
          create: { tenantId, ...o, enabled: o.enabled }, update: { enabled: o.enabled },
        });
      }
      await tx.systemLog.create({ data: { tenantId, level: 'INFO', message: 'CLIENT_ADMIN_ACTION', context: { actorId, action: 'MODULE_ACCESS_UPDATED', overrides } } });
    });
    return this.getModulesForTenant(tenantId);
  }
}
