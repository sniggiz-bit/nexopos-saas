import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { ClientFilesService, localAssetPath } from './client-files.service';
import { crossTenantReferenceSql } from './tenant-data-ownership';

@Injectable()
export class ClientDeletionService {
  constructor(private prisma: PrismaService, private files: ClientFilesService, private events: EventsGateway) {}
  async preview(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id }, select: {
      id: true, name: true, slug: true,
      users: { select: { role: true } },
      _count: { select: { users: true, branches: true, products: true, sales: true, purchases: true, customers: true, suppliers: true, quotes: true, credits: true, invoices: true, ecommerceConnections: true } },
    } });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    return { id, name: tenant.name, confirmation: 'ELIMINAR ' + tenant.slug, counts: tenant._count, protectedAccount: tenant.users.some(u => u.role === 'SUPER_ADMIN') };
  }
  async remove(id: string, confirmation: string, password: string, actorId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor || actor.role !== 'SUPER_ADMIN' || !actor.isActive || !actor.password ||
        !await bcrypt.compare(password, actor.password)) throw new ForbiddenException('La contraseña del superadmin no es correcta.');
    if (actor.tenantId === id) throw new ForbiddenException('No puedes eliminar tu propia cuenta de plataforma.');
    const result = await this.prisma.$transaction(async tx => {
      await tx.$queryRawUnsafe('SELECT "id" FROM "Tenant" WHERE "id"=$1 FOR UPDATE', id);
      const tenant = await tx.tenant.findUnique({ where: { id }, include: {
        users: { select: { id: true, role: true } },
        products: { select: { image: true, galleryImages: true } },
        uploadAssets: { select: { path: true } }, dteConfig: { select: { liorenLogo: true } },
      } });
      if (!tenant) throw new NotFoundException('Empresa no encontrada.');
      if (tenant.users.some(u => u.role === 'SUPER_ADMIN')) throw new ForbiddenException('Esta empresa contiene cuentas de la plataforma y está protegida.');
      if (confirmation !== 'ELIMINAR ' + tenant.slug) throw new BadRequestException('La confirmación escrita no coincide con esta empresa.');
      const integrity = await tx.$queryRawUnsafe<Array<{ conflict: boolean }>>(crossTenantReferenceSql(), id);
      if (integrity[0]?.conflict) throw new ConflictException('Hay referencias inconsistentes entre empresas. No se eliminó ningún dato; revisa las asignaciones antes de continuar.');
      const candidates = new Set<string>();
      const collect = (v: unknown) => {
        if (typeof v === 'string') { const url = localAssetPath(v); if (url) candidates.add(url); }
        else if (Array.isArray(v)) v.forEach(collect);
        else if (v && typeof v === 'object') Object.values(v).forEach(collect);
      };
      collect([tenant.products, tenant.uploadAssets, tenant.logoUrl, tenant.storeSettings, tenant.dteConfig]);
      const sale = { tenantId: id };
      const product = { tenantId: id };
      const branch = { tenantId: id };
      // Children first; every predicate is scoped to this tenant through its owning parent.
      await tx.creditPayment.deleteMany({ where: { credit: { tenantId: id } } });
      await tx.credit.deleteMany({ where: { tenantId: id } });
      await tx.payment.deleteMany({ where: { sale } });
      await tx.saleItem.deleteMany({ where: { sale } });
      await tx.paymentTransaction.deleteMany({ where: { tenantId: id } });
      await tx.sale.deleteMany({ where: { tenantId: id } });
      await tx.quoteItem.deleteMany({ where: { quote: { tenantId: id } } });
      await tx.quote.deleteMany({ where: { tenantId: id } });
      await tx.purchaseItem.deleteMany({ where: { purchase: { tenantId: id } } });
      await tx.purchase.deleteMany({ where: { tenantId: id } });
      await tx.transferItem.deleteMany({ where: { transfer: { originBranch: { tenantId: id } } } });
      await tx.transfer.deleteMany({ where: { originBranch: { tenantId: id } } });
      await tx.stockMovement.deleteMany({ where: { branch } });
      await tx.cashShift.deleteMany({ where: { branch } });
      await tx.inventory.deleteMany({ where: { product } });
      await tx.ecommerceOrder.deleteMany({ where: { tenantId: id } });
      await tx.syncLog.deleteMany({ where: { tenantId: id } });
      await tx.ecommerceConnection.deleteMany({ where: { tenantId: id } });
      await tx.product.deleteMany({ where: { tenantId: id } });
      await tx.brand.deleteMany({ where: { tenantId: id } });
      await tx.category.deleteMany({ where: { tenantId: id } });
      await tx.supplier.deleteMany({ where: { tenantId: id } });
      await tx.customer.deleteMany({ where: { tenantId: id } });
      await tx.chatSession.deleteMany({ where: { visitorId: { startsWith: 'account:' + id + ':' } } });
      await tx.user.deleteMany({ where: { tenantId: id } });
      await tx.branch.deleteMany({ where: { tenantId: id } });
      await tx.dteConfig.deleteMany({ where: { tenantId: id } });
      await tx.tenantSettings.deleteMany({ where: { tenantId: id } });
      await tx.systemLog.deleteMany({ where: { tenantId: id } });
      await tx.tenant.delete({ where: { id } });
      const audit = await tx.systemLog.create({ data: {
        level: 'INFO', message: 'CLIENT_ACCOUNT_DELETED',
        context: { actorId, deletedTenantId: id, filesPending: [...candidates] },
      } });
      return { auditId: audit.id, candidates: [...candidates] };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 60000 });
    this.events.revokeTenant(id);
    let cleanup: { removed: number; shared: number; failed: string[] };
    try { cleanup = await this.files.clean(id, result.candidates); }
    catch { cleanup = { removed: 0, shared: 0, failed: [...result.candidates, 'receipts/' + id] }; }
    await this.prisma.systemLog.update({ where: { id: result.auditId }, data: {
      level: cleanup.failed.length ? 'WARNING' : 'INFO',
      context: { actorId, deletedTenantId: id, filesPending: cleanup.failed, removedFiles: cleanup.removed, preservedSharedFiles: cleanup.shared },
    } }).catch(() => undefined);
    return { deleted: true, id, cleanup: { removed: cleanup.removed, shared: cleanup.shared, pending: cleanup.failed.length } };
  }
  async retryCleanup(auditId: string, actorId: string) {
    const log = await this.prisma.systemLog.findUnique({ where: { id: auditId } });
    const context = log?.context as Record<string, any> | null;
    if (!log || log.message !== 'CLIENT_ACCOUNT_DELETED' || typeof context?.deletedTenantId !== 'string' || !Array.isArray(context.filesPending)) throw new NotFoundException('Registro de limpieza no encontrado.');
    if (await this.prisma.tenant.findUnique({ where: { id: context.deletedTenantId } })) throw new ConflictException('La cuenta existe actualmente. No se limpiarán archivos de una cuenta restaurada.');
    const result = await this.files.clean(context.deletedTenantId, context.filesPending.filter((v: unknown) => typeof v === 'string'));
    await this.prisma.systemLog.update({ where: { id: auditId }, data: { level: result.failed.length ? 'WARNING' : 'INFO', context: { ...context, cleanupActorId: actorId, filesPending: result.failed, removedFiles: Number(context.removedFiles || 0) + result.removed, preservedSharedFiles: Number(context.preservedSharedFiles || 0) + result.shared } } });
    return { removed: result.removed, shared: result.shared, pending: result.failed.length };
  }

}
