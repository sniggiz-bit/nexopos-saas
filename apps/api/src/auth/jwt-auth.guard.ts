import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { BillingStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { effectiveModuleCodes, moduleForRequest, moduleTenantInclude } from '../modules/module-access';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService, private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest();
    // The global guard and an explicit route guard may both run for this request.
    if (request.accountVerified === true) return true;
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();
    let payload: any;
    try { payload = await this.jwtService.verifyAsync(token); } catch { throw new UnauthorizedException(); }
    if (typeof payload.sub !== 'string' || !['TENANT_ADMIN', 'MANAGER', 'CASHIER', 'SUPER_ADMIN'].includes(payload.role)) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: { include: moduleTenantInclude } },
    });
    if (!user || !user.isActive || !user.tenant || user.tenantId !== payload.tenantId ||
        (payload.tokenVersion ?? 0) !== user.tokenVersion) throw new UnauthorizedException('La sesión ya no es válida. Vuelve a iniciar sesión.');
    const tenant = user.tenant;
    const catalog = await this.prisma.module.findMany({ select: { code: true, isActive: true } });
    const modules = effectiveModuleCodes(tenant, catalog);
    request.user = {
      sub: user.id, id: user.id, email: user.email, name: user.name,
      role: user.role, tenantId: user.tenantId, branchId: user.branchId,
      tokenVersion: user.tokenVersion, modules,
    };
    if (user.role !== 'SUPER_ADMIN') {
      if (tenant.status !== 'ACTIVE') throw new ForbiddenException('Tu cuenta ha sido suspendida. Contacta al administrador.');
      const path = (request.originalUrl || request.url).split('?')[0].replace(/^\/api(?=\/|$)/, '');
      if (tenant.billingStatus !== BillingStatus.ACTIVE &&
          !['/auth', '/modules', '/billing', '/mercadopago', '/support', '/branches', '/tenants'].some(p => path === p || path.startsWith(p + '/'))) {
        throw new HttpException('Tu suscripción tiene pagos pendientes. Contacta al administrador.', HttpStatus.PAYMENT_REQUIRED);
      }
      const closingShift = path === '/shifts/close' && request.method === 'POST';
      const requiredModule = moduleForRequest(path);
      if (requiredModule && !closingShift && !modules.includes(requiredModule)) {
        throw new ForbiddenException('Este servicio está deshabilitado para tu empresa. Contacta al administrador.');
      }
      if (path.startsWith('/integrations')) {
        const connectionId = request.params?.id && path.startsWith('/integrations/connections/') ? request.params.id : request.body?.connectionId;
        const connection = connectionId ? await this.prisma.ecommerceConnection.findFirst({ where: { id: connectionId, tenantId: user.tenantId }, select: { platform: true } }) : null;
        const order = request.params?.id && path.startsWith('/integrations/orders/') ? await this.prisma.ecommerceOrder.findFirst({ where: { id: request.params.id, tenantId: user.tenantId }, select: { connection: { select: { platform: true } } } }) : null;
        if (request.params?.id && path.startsWith('/integrations/orders/') && !order) throw new ForbiddenException('La orden no pertenece a tu empresa.');
        const platform = connection?.platform || order?.connection.platform || request.body?.platform;
        if (connectionId && !connection || platform && !modules.includes(platform) || !platform && !['SHOPIFY', 'WOOCOMMERCE'].some(c => modules.includes(c))) throw new ForbiddenException('Esta integración no está habilitada para tu empresa.');
      }
      if (path.endsWith('/nota-credito') && !modules.includes('DTE_NOTA_CREDITO')) throw new ForbiddenException('La emisión de notas de crédito está deshabilitada.');
      // Validate every explicit branch reference, including query parameters.
      if ([request.body?.tenantId, request.query?.tenantId].some(id => id && id !== user.tenantId)) throw new ForbiddenException('La empresa no coincide con tu sesión.');
      const sources = [request.body, request.query, request.params].filter(x => x && typeof x === 'object' && !Array.isArray(x));
      const ids: string[] = [...new Set<string>(sources.flatMap(x =>
        ['branchId', 'originBranchId', 'destBranchId', 'destinationBranchId', 'fromBranchId', 'toBranchId'].map(k => x[k]).filter(v => typeof v === 'string' && v)))];
      const writes = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
      const branchOperation = /^\/(sales|shifts|inventory|purchases|transfers|transbank|treasury)(\/|$)/.test(path) || path.startsWith('/products') && (Number(request.body?.stock) > 0 || request.method === 'PATCH' && request.body?.stock !== undefined);
      const shiftId = request.body?.shiftId || request.body?.cashShiftId || request.params?.shiftId;
      if (typeof shiftId === 'string') {
        const shift = await this.prisma.cashShift.findFirst({ where: { id: shiftId, branch: { tenantId: user.tenantId } }, select: { branchId: true } });
        if (!shift) throw new ForbiddenException('La caja no pertenece a tu empresa.');
        if (!ids.includes(shift.branchId)) ids.push(shift.branchId);
      }
      if (writes && request.params?.id && path.startsWith('/sales/')) {
        const sale = await this.prisma.sale.findFirst({ where: { id: request.params.id, tenantId: user.tenantId }, select: { branchId: true } });
        if (!sale) throw new ForbiddenException('La venta no pertenece a tu empresa.');
        if (!ids.includes(sale.branchId)) ids.push(sale.branchId);
      }
      if (writes && branchOperation && !ids.length) {
        if (!user.branchId) throw new ForbiddenException('No tienes una sucursal asignada.');
        ids.push(user.branchId);
      }
      if (ids.length) {
        const branches = await this.prisma.branch.findMany({ where: { id: { in: ids }, tenantId: user.tenantId } });
        if (branches.length !== ids.length) throw new ForbiddenException('La sucursal no pertenece a tu empresa.');
        if (writes && user.role !== 'TENANT_ADMIN' && branches.some(b => b.id !== user.branchId)) {
          throw new ForbiddenException('Solo puedes operar en tu sucursal asignada.');
        }
        if (writes && branchOperation && !closingShift && branches.some(b => !b.isActive)) {
          throw new ForbiddenException('La sucursal está deshabilitada. Contacta al administrador.');
        }
      }
    }
    request.accountVerified = true;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
