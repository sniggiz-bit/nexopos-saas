import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { effectiveModuleCodes, moduleTenantInclude } from '../modules/module-access';
import { DTE_CODES, DTE_LABELS, DTE_TYPES, LiorenApiService, normalizeRut, usableToken } from './lioren-api.service';

@Injectable()
export class LiorenAccountService {
  private readonly cache = new Map<string, { until: number; value: Promise<any> }>();
  constructor(private prisma: PrismaService, private api: LiorenApiService) {}
  fingerprint(token: string) { return createHash('sha256').update(token).digest('hex'); }
  invalidate(tenantId: string) { for (const key of this.cache.keys()) if (key.startsWith(tenantId + ':')) this.cache.delete(key); }
  async connection(tenantId: string, fresh = false) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { ...moduleTenantInclude, dteConfig: true } });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    const catalog = await this.prisma.module.findMany({ select: { code: true, isActive: true } });
    const enabled = effectiveModuleCodes(tenant, catalog);
    const config = tenant.dteConfig;
    const token = config?.liorenToken?.trim() || '';
    const empty = DTE_TYPES.map(type => ({ type, label: DTE_LABELS[type], providerActive: null as boolean | null, available: null as number | null, nextFolio: null as number | null, localEnabled: enabled.includes(DTE_CODES[type]), ready: false }));
    const base = { registeredRut: tenant.rut, configured: !!token, checkedAt: new Date().toISOString(), connected: false, state: 'not_configured', message: 'Control de ventas interno activo. Las ventas generan comprobantes internos sin emisión de documentos tributarios.', company: null as any, identityMatches: false, resolutionMatches: false, certificateValid: false, types: empty };
    if (!usableToken(token)) return { tenant, config, token: '', status: { ...base, state: token ? 'invalid_token' : 'not_configured', message: token ? 'La credencial es de prueba o no tiene un formato válido. No se habilita emisión.' : base.message } };
    const key = tenantId + ':' + this.fingerprint(token);
    let cached = this.cache.get(key);
    if (fresh || !cached || cached.until < Date.now()) {
      if (this.cache.size > 100) this.cache.clear();
      cached = { until: Date.now() + 30000, value: Promise.allSettled([this.api.company(token), this.api.types(token)]) };
      this.cache.set(key, cached);
    }
    const [companyResult, typesResult] = await cached.value;
    if (companyResult.status !== 'fulfilled') {
      const error = companyResult.reason;
      return { tenant, config, token, status: { ...base, state: error.status === 401 ? 'invalid_token' : 'unavailable', message: error.message || 'El servicio de facturación no está disponible para consulta.' } };
    }
    const company = companyResult.value;
    const identityMatches = !!normalizeRut(tenant.rut) && normalizeRut(tenant.rut) === normalizeRut(company.rut);
    const resolutionMatches = !!company.resolution && !!company.resolutionDate && String(config?.dteResolution || '').trim() === company.resolution.trim() && config?.resolutionDate?.toISOString().slice(0, 10) === company.resolutionDate;
    const from = Date.parse(company.validFrom || ''); const to = Date.parse(company.validTo || '');
    const certificateValid = Number.isFinite(from) && Number.isFinite(to) && Date.now() >= from && Date.now() <= to;
    const types = typesResult.status === 'fulfilled' ? typesResult.value.map((type: any) => ({ ...type, localEnabled: enabled.includes(DTE_CODES[type.type]), ready: identityMatches && resolutionMatches && certificateValid && type.providerActive && type.available !== null && type.available > 0 && !!type.nextFolio && enabled.includes(DTE_CODES[type.type]) && tenant.status === 'ACTIVE' && tenant.billingStatus === 'ACTIVE' })) : empty;
    const state = !identityMatches ? 'identity_mismatch' : !resolutionMatches ? 'resolution_mismatch' : !certificateValid ? 'certificate_invalid' : typesResult.status !== 'fulfilled' ? 'partial' : 'ready';
    const messages: Record<string, string> = { identity_mismatch: 'El RUT registrado no coincide con la empresa del token. Sincroniza la empresa emisora antes de emitir.', resolution_mismatch: 'La resolución SII no coincide con el servicio de facturación. Sincroniza los datos de la empresa emisora.', certificate_invalid: 'El certificado no está vigente o el servicio de facturación no informó sus fechas. Revisa el certificado en el servicio de facturación.', partial: 'Se verificó la empresa, pero no se pudieron consultar los folios. No se habilita emisión.', ready: 'Empresa y resolución verificadas. La disponibilidad de cada documento aparece a continuación.' };
    return { tenant, config, token, status: { ...base, connected: true, state, message: messages[state], company, identityMatches, resolutionMatches, certificateValid, types } };
  }
  async status(tenantId: string, fresh = false) { return (await this.connection(tenantId, fresh)).status; }
  async requireEmission(tenantId: string, type: number) {
    const connection = await this.connection(tenantId, true);
    if (!connection.status.types.find((item: any) => item.type === type)?.ready) throw new ForbiddenException(connection.status.state === 'ready' ? 'Este documento no tiene servicio habilitado o folios disponibles. Revisa el servicio de facturación y los módulos de la empresa.' : connection.status.message);
    return connection;
  }
  async syncIssuer(tenantId: string, expectedRut: string, actorId: string) {
    const connection = await this.connection(tenantId, true);
    const company = connection.status.company;
    if (!connection.status.connected || !company) throw new BadRequestException(connection.status.message);
    if (!expectedRut || normalizeRut(expectedRut) !== normalizeRut(company.rut)) throw new ConflictException('La empresa consultada cambió. Actualiza la validación antes de sincronizar.');
    if (!company.resolution || !company.resolutionDate || !/^\d{4}-\d{2}-\d{2}$/.test(company.resolutionDate)) throw new BadRequestException('El servicio de facturación no informó una resolución válida. Revisa la empresa en el proveedor.');
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRawUnsafe('SELECT "id" FROM "Tenant" WHERE "id"=$1 FOR UPDATE', tenantId);
      const current = await tx.dteConfig.findUnique({ where: { tenantId } });
      if (!current || current.liorenToken !== connection.config?.liorenToken || current.updatedAt.getTime() !== connection.config.updatedAt.getTime()) throw new ConflictException('La configuración cambió durante la validación. Vuelve a consultar.');
      await tx.tenant.update({ where: { id: tenantId }, data: { rut: company.rut } });
      await tx.dteConfig.update({ where: { tenantId }, data: { dteResolution: company.resolution, resolutionDate: new Date(company.resolutionDate + 'T00:00:00Z') } });
      await tx.systemLog.create({ data: { tenantId, level: 'INFO', message: 'DTE_ISSUER_SYNCHRONIZED', context: { actorId, fields: ['rut', 'dteResolution', 'resolutionDate'] } } });
    });
    return this.status(tenantId);
  }
}
