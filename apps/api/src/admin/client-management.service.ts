import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TenantsService } from '../tenants/tenants.service';
import { UpdateTenantSettingsDto } from '../tenants/dto/update-tenant-settings.dto';
import { EventsGateway } from '../events/events.gateway';
import { ClientProfileDto, ClientUserDto } from './dto/client-management.dto';

export const clientUserSelect = {
  id: true, name: true, email: true, role: true, branchId: true, isActive: true,
  createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class ClientManagementService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService, private events: EventsGateway, private tenants: TenantsService) {}
  revokeSessions(tenantId: string) { this.events.revokeTenant(tenantId); }
  async updatePlan(tenantId: string, planId: string | null, actorId: string) {
    if (planId !== null && (typeof planId !== 'string' || !planId)) throw new BadRequestException('Selecciona un plan válido.');
    await this.tenants.updatePlan(tenantId, planId, actorId);
    this.events.revokeTenant(tenantId);
    return this.detail(tenantId);
  }
  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto, actorId: string) {
    await this.tenants.updateSettings(tenantId, dto, actorId);
    return this.detail(tenantId);
  }
  private async lock(tx: Prisma.TransactionClient, tenantId: string) {
    const found = await tx.$queryRawUnsafe<Array<{ id: string }>>('SELECT "id" FROM "Tenant" WHERE "id"=$1 FOR UPDATE', tenantId);
    if (!found.length) throw new NotFoundException('Empresa no encontrada.');
  }
  private audit(tx: Prisma.TransactionClient, tenantId: string, actorId: string, action: string, userId?: string) {
    return tx.systemLog.create({ data: { tenantId, level: 'INFO', message: 'CLIENT_ADMIN_ACTION', context: { actorId, action, ...(userId ? { userId } : {}) } } });
  }
  async detail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        settings: true, plan: true,
        users: { select: clientUserSelect, orderBy: { createdAt: 'asc' } },
        branches: { orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }], include: { _count: { select: { users: true, sales: true } } } },
        invoices: { take: 50, orderBy: { createdAt: 'desc' } },
        _count: { select: { users: true, branches: true, products: true, sales: true, customers: true, purchases: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    return { ...tenant, protectedAccount: tenant.users.some(u => u.role === 'SUPER_ADMIN') };
  }
  async updateProfile(id: string, dto: ClientProfileDto, actorId: string) {
    if (dto.name !== undefined && (typeof dto.name !== 'string' || !dto.name.trim())) throw new BadRequestException('El nombre de la empresa es obligatorio.');
    if (dto.billingStatus !== undefined && !['ACTIVE', 'PAST_DUE', 'CANCELED'].includes(dto.billingStatus)) throw new BadRequestException('Estado de suscripción inválido.');
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.lock(tx, id);
      await tx.tenant.update({ where: { id }, data: {
        ...dto, name: dto.name?.trim(), nextPayment: dto.nextPayment === null ? null : dto.nextPayment ? new Date(dto.nextPayment) : undefined,
      } });
      await this.audit(tx, id, actorId, 'PROFILE_UPDATED');
    });
    if (dto.billingStatus) this.events.revokeTenant(id);
    return this.detail(id);
  }
  private validateUserInput(dto: ClientUserDto) {
    if (dto.isActive !== undefined && typeof dto.isActive !== 'boolean') throw new BadRequestException('Estado de usuario inválido.');
    if (dto.role !== undefined && !['TENANT_ADMIN', 'MANAGER', 'CASHIER'].includes(dto.role)) throw new BadRequestException('Rol de usuario inválido.');
  }
  async createUser(tenantId: string, dto: ClientUserDto, actorId: string) {
    this.validateUserInput(dto);
    if (!dto.email || !dto.password) throw new BadRequestException('Correo y contraseña son obligatorios.');
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('La contraseña excede 72 bytes.');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.lock(tx, tenantId);
      await this.validateBranch(tx, tenantId, dto.branchId);
      const settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
      if (await tx.user.count({ where: { tenantId, isActive: true } }) >= (settings?.maxUsers ?? 3)) throw new ConflictException('Aumenta el límite de usuarios de este cliente antes de agregar otro.');
      if (await tx.user.findUnique({ where: { email: dto.email!.trim().toLowerCase() } })) throw new ConflictException('El correo ya está registrado.');
      const created = await tx.user.create({ data: {
        tenantId, email: dto.email!.trim().toLowerCase(), name: dto.name?.trim(), password,
        role: dto.role || 'MANAGER', branchId: dto.branchId || null, isActive: dto.isActive ?? true,
      }, select: clientUserSelect });
      await this.audit(tx, tenantId, actorId, 'USER_CREATED', created.id);
      return created;
    });
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
    this.notifications.notifySuperAdmin('Nuevo usuario interno', 'Empresa: ' + tenant?.name + '\nUsuario: ' + (user.name || 'Sin nombre') + '\nCorreo: ' + user.email + '\nRol: ' + user.role, 'REGISTRATION', { actionPath: '/admin/tenants/' + tenantId }).catch(() => undefined);
    return user;
  }
  private async validateBranch(tx: Prisma.TransactionClient, tenantId: string, branchId?: string | null) {
    if (!branchId) return;
    const branch = await tx.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new BadRequestException('La sucursal no pertenece a este cliente.');
    if (!branch.isActive) throw new BadRequestException('Habilita la sucursal antes de asignar un usuario.');
  }
  async updateUser(tenantId: string, userId: string, dto: ClientUserDto, actorId: string) {
    this.validateUserInput(dto);
    if (dto.password && Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('La contraseña excede 72 bytes.');
    const password = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.lock(tx, tenantId);
      const user = await tx.user.findFirst({ where: { id: userId, tenantId } });
      if (!user) throw new NotFoundException('Usuario no encontrado en esta empresa.');
      if (user.role === 'SUPER_ADMIN') throw new ForbiddenException('Las cuentas de la plataforma no se modifican desde una ficha de cliente.');
      if (dto.branchId !== undefined && dto.branchId !== user.branchId) await this.validateBranch(tx, tenantId, dto.branchId);
      if (dto.isActive === true && !user.isActive) {
        const settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
        if (await tx.user.count({ where: { tenantId, isActive: true } }) >= (settings?.maxUsers ?? 3)) throw new ConflictException('Aumenta el límite de usuarios antes de habilitar otro.');
      }
      const email = dto.email?.trim().toLowerCase();
      if (email && email !== user.email && await tx.user.findUnique({ where: { email } })) throw new ConflictException('El correo ya está registrado.');
      const updated = await tx.user.update({ where: { id: userId }, data: {
        ...dto, name: dto.name?.trim(), email, password,
        ...(password ? { tokenVersion: { increment: 1 } } : {}),
      }, select: clientUserSelect });
      await this.audit(tx, tenantId, actorId, password ? 'USER_PASSWORD_RESET' : 'USER_UPDATED', userId);
      return updated;
    });
    this.events.revokeUser(userId);
    return result;
  }
  async removeUser(tenantId: string, userId: string, confirmation: string, actorId: string) {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.lock(tx, tenantId);
      const user = await tx.user.findFirst({ where: { id: userId, tenantId }, include: {
        _count: { select: { sales: true, quotes: true, stockMovements: true, shiftsOpened: true, shiftsClosed: true, requestedTransfers: true, processedTransfers: true } },
      } });
      if (!user) throw new NotFoundException('Usuario no encontrado.');
      if (user.role === 'SUPER_ADMIN' || user.id === actorId) throw new ForbiddenException('No puedes eliminar esta cuenta de administración.');
      if (confirmation !== user.email) throw new BadRequestException('Escribe el correo exacto del usuario para confirmar.');
      if (Object.values(user._count).some(n => n > 0)) throw new ConflictException('Este usuario tiene historial. Deshabilítalo para conservar la trazabilidad; la eliminación completa de la empresa se gestiona en Acciones.');
      await tx.chatSession.deleteMany({ where: { visitorId: 'account:' + tenantId + ':' + userId } });
      await tx.user.delete({ where: { id: userId } });
      await this.audit(tx, tenantId, actorId, 'USER_DELETED', userId);
    });
    this.events.revokeUser(userId);
    return { deleted: true, id: userId };
  }
}
