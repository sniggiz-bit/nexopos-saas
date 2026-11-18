import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type BranchChange = { name?: string; address?: string; isMain?: boolean; isActive?: boolean };
@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}
  private async lock(tx: Prisma.TransactionClient, tenantId: string) {
    const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>('SELECT "id" FROM "Tenant" WHERE "id"=$1 FOR UPDATE', tenantId);
    if (!rows.length) throw new NotFoundException('Empresa no encontrada.');
  }
  private validate(data: BranchChange) {
    if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 120)) throw new BadRequestException('Indica un nombre de sucursal de hasta 120 caracteres.');
    if (data.address !== undefined && (typeof data.address !== 'string' || data.address.length > 300)) throw new BadRequestException('Dirección inválida.');
    for (const key of ['isMain', 'isActive']) if (data[key] !== undefined && typeof data[key] !== 'boolean') throw new BadRequestException('Estado de sucursal inválido.');
  }
  private async activeLimit(tx: Prisma.TransactionClient, tenantId: string) {
    const settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
    if (await tx.branch.count({ where: { tenantId, isActive: true } }) >= (settings?.maxBranches ?? 1)) {
      throw new ConflictException('Aumenta el límite de sucursales de este cliente antes de habilitar otra.');
    }
  }
  private audit(tx: Prisma.TransactionClient, tenantId: string, actorId: string | undefined, action: string, branchId: string) {
    return tx.systemLog.create({ data: { tenantId, level: 'INFO', message: 'CLIENT_ADMIN_ACTION', context: { actorId: actorId || 'superadmin', action, branchId } } });
  }
  async create(data: BranchChange & { name: string; tenantId: string }, actorId?: string) {
    if (typeof data.name !== 'string' || typeof data.tenantId !== 'string' || !data.tenantId || data.tenantId.length > 128) throw new BadRequestException('Nombre y empresa son obligatorios.');
    this.validate(data);
    return this.prisma.$transaction(async tx => {
      await this.lock(tx, data.tenantId);
      if (data.isActive) await this.activeLimit(tx, data.tenantId);
      const first = await tx.branch.count({ where: { tenantId: data.tenantId } }) === 0;
      if (data.isMain || first) await tx.branch.updateMany({ where: { tenantId: data.tenantId }, data: { isMain: false } });
      const branch = await tx.branch.create({ data: { tenantId: data.tenantId, name: data.name.trim(), address: data.address?.trim(), isMain: first || !!data.isMain, isActive: data.isActive ?? false } });
      const products = await tx.product.findMany({ where: { tenantId: data.tenantId }, select: { id: true } });
      if (products.length) await tx.inventory.createMany({ data: products.map(p => ({ productId: p.id, branchId: branch.id, quantity: 0, minStock: 0 })), skipDuplicates: true });
      await this.audit(tx, data.tenantId, actorId, 'BRANCH_CREATED', branch.id);
      return branch;
    });
  }
  findAll(tenantId: string) {
    return this.prisma.branch.findMany({ where: { tenantId }, orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }] });
  }
  findOne(id: string) { return this.prisma.branch.findUnique({ where: { id } }); }
  findAllSystemWide() {
    return this.prisma.branch.findMany({ include: { tenant: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  }
  async updateForTenant(tenantId: string, id: string, data: BranchChange, actorId?: string) {
    this.validate(data);
    return this.prisma.$transaction(async tx => {
      await this.lock(tx, tenantId);
      const branch = await tx.branch.findFirst({ where: { id, tenantId } });
      if (!branch) throw new NotFoundException('Sucursal no encontrada en esta empresa.');
      if (data.isActive === true && !branch.isActive) await this.activeLimit(tx, tenantId);
      if (data.isMain === false && branch.isMain) throw new ConflictException('Asigna otra sucursal como matriz antes de quitar esta condición.');
      if (data.isMain) await tx.branch.updateMany({ where: { tenantId, id: { not: id } }, data: { isMain: false } });
      const updated = await tx.branch.update({ where: { id }, data: { ...data, name: data.name?.trim(), address: data.address?.trim() } });
      await this.audit(tx, tenantId, actorId, 'BRANCH_UPDATED', id);
      return updated;
    });
  }
  async updateStatus(id: string, isActive: boolean, actorId?: string) {
    const branch = await this.findOne(id);
    if (!branch) throw new NotFoundException('Sucursal no encontrada.');
    return this.updateForTenant(branch.tenantId, id, { isActive }, actorId);
  }
  async removeForTenant(tenantId: string, id: string, actorId: string) {
    return this.prisma.$transaction(async tx => {
      await this.lock(tx, tenantId);
      const branch = await tx.branch.findFirst({ where: { id, tenantId }, include: {
        _count: { select: { users: true, sales: true, purchases: true, cashShifts: true, stockMovements: true, transfersFrom: true, transfersTo: true, transbankTransactions: true } },
      } });
      if (!branch) throw new NotFoundException('Sucursal no encontrada.');
      if (branch.isMain || await tx.branch.count({ where: { tenantId } }) < 2) throw new ConflictException('Conserva una sucursal principal. Asigna otra como matriz antes de eliminar esta.');
      if (Object.values(branch._count).some(n => n > 0) || await tx.inventory.count({ where: { branchId: id, quantity: { not: 0 } } })) {
        throw new ConflictException('La sucursal tiene usuarios, existencias o historial. Reasigna los usuarios o deshabilítala para conservar sus registros.');
      }
      await tx.inventory.deleteMany({ where: { branchId: id } });
      await tx.branch.delete({ where: { id } });
      await this.audit(tx, tenantId, actorId, 'BRANCH_DELETED', id);
      return { deleted: true, id };
    });
  }
}
