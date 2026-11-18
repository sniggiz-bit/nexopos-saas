import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiorenAccountService } from '../dte/lioren-account.service';
import { chileMonth, DTE_TYPES, DTE_LABELS, LiorenApiService, usableToken } from '../dte/lioren-api.service';

export interface ConfigInput { tenantId: string; liorenToken?: string; liorenLogo?: string; dteResolution?: string; resolutionDate?: Date | null }
export interface DteConfigResponseDto { id: string; tenantId: string; hasToken: boolean; liorenLogo: string | null; dteResolution: string | null; resolutionDate: Date | null }
@Injectable()
export class DteConfigService {
  private readonly statsCache = new Map<string, { until: number; value: Promise<any> }>();
  constructor(private prisma: PrismaService, private account: LiorenAccountService, private api: LiorenApiService) {}
  private response(config: any): DteConfigResponseDto { return { id: config.id, tenantId: config.tenantId, hasToken: !!config.liorenToken, liorenLogo: config.liorenLogo, dteResolution: config.dteResolution, resolutionDate: config.resolutionDate }; }
  async findByTenant(tenantId: string) { const config = await this.prisma.dteConfig.findUnique({ where: { tenantId } }); return config ? this.response(config) : null; }
  async upsert(input: ConfigInput) {
    const { tenantId, ...data } = input;
    if (data.liorenToken !== undefined) {
      data.liorenToken = data.liorenToken.trim();
      if (!usableToken(data.liorenToken)) throw new BadRequestException('Ingresa una credencial real válida. Se conserva el token actual.');
      await this.api.company(data.liorenToken).catch(() => { throw new BadRequestException('Lioren no pudo validar la nueva credencial. Se conserva el token actual.'); });
    }
    if (data.resolutionDate && !Number.isFinite(data.resolutionDate.getTime())) throw new BadRequestException('La fecha de resolución no es válida.');
    const config = await this.prisma.dteConfig.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    return this.response(config);
  }
  async update(id: string, tenantId: string, data: Omit<ConfigInput, 'tenantId'>) {
    if (!await this.prisma.dteConfig.findFirst({ where: { id, tenantId } })) throw new NotFoundException('Configuración no encontrada para esta empresa.');
    // The tenant key remains the write predicate even when the legacy id route is used.
    return this.upsert({ tenantId, ...data });
  }
  async getStats(tenantId: string, fresh = false) {
    const connection = await this.account.connection(tenantId, fresh);
    const month = chileMonth();
    const key = tenantId + ':' + connection.config?.updatedAt.toISOString() + ':' + month.label;
    let cached = this.statsCache.get(key);
    if (fresh || !cached || cached.until < Date.now()) {
      if (this.statsCache.size > 100) this.statsCache.clear();
      cached = { until: Date.now() + 60000, value: this.providerStats(connection, month) };
      this.statsCache.set(key, cached);
    }
    const provider = await cached.value;
    const [confirmed, unverified, errors, pending, reviewDocs] = await Promise.all([
      this.prisma.sale.count({ where: { tenantId, dteVerifiedAt: { not: null }, dteFolio: { not: null } } }),
      this.prisma.sale.count({ where: { tenantId, dteVerifiedAt: null, OR: [{ dteFolio: { not: null } }, { dtePdfUrl: { contains: 'ejemplo-mock' } }] } }),
      this.prisma.sale.count({ where: { tenantId, dteStatus: { in: ['ERROR', 'RECHAZADO', 'REQUIERE_REVISION', 'BLOQUEADO'] } } }),
      this.prisma.sale.count({ where: { tenantId, dteStatus: { in: ['ENVIANDO', 'PENDIENTE_CONFIRMACION', 'EMITIDO', 'PENDIENTE_SII', 'REPARO'] } } }),
      this.prisma.sale.findMany({ where: { tenantId, dteProviderId: { not: null }, dteFolio: { not: null }, dteSubmission: { isNot: null }, dteStatus: { in: ['EMITIDO', 'PENDIENTE_SII', 'REPARO'] } }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, dteType: true, dteFolio: true, dteStatus: true } }),
    ]);
    return { connection: connection.status, provider, local: { confirmed, unverified, errors, pending, reviewDocs }, thisMonth: provider.total, totalAccepted: provider.accepted, errorCount: errors };
  }
  private async providerStats(connection: any, month: ReturnType<typeof chileMonth>) {
    const types = DTE_TYPES.map(type => ({ type, label: DTE_LABELS[type], total: null as number | null, accepted: null as number | null, rejected: null as number | null, message: '' }));
    const recent: any[] = [];
    if (!connection.status.connected) return { source: 'lioren', month: month.label, from: month.from, to: month.to, checkedAt: new Date().toISOString(), total: null, accepted: null, rejected: null, partial: true, types, recent };
    const jobs = types.flatMap(type => ['total', 'accepted', 'rejected'].map(metric => ({ type, metric })));
    let next = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < jobs.length) {
        const { type, metric } = jobs[next++];
        try {
          const response = await this.api.index(connection.token, type.type, { fecha_desde: month.from, fecha_hasta: month.to, rpp: 10, page: 1, orderby: 'fecha', direction: 'desc', ...(metric === 'total' ? {} : { estado: metric === 'accepted' ? 'acepta' : 'rechazo' }) });
          (type as any)[metric] = response.total;
          if (metric === 'total') for (const row of response.rows) {
            if (!Number.isSafeInteger(Number(row.folio)) || Number(row.folio) <= 0 || Number(row.tipodoc) !== type.type || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) continue;
            recent.push({ type: type.type, label: type.label, folio: Number(row.folio), date: row.fecha, total: Number.isFinite(Number(row.montototal)) ? Number(row.montototal) : null, state: ['acepta', 'rechazo', 'reparo', 'pendiente'].includes(row.estado) ? row.estado : 'pendiente' });
          }
        } catch { type.message = 'Consulta no disponible. No se interpreta como cero documentos.'; }
      }
    }));
    const sum = (key: 'total' | 'accepted' | 'rejected') => types.some(type => type[key] === null) ? null : types.reduce((value, type) => value + type[key]!, 0);
    return { source: 'lioren', month: month.label, from: month.from, to: month.to, checkedAt: new Date().toISOString(), total: sum('total'), accepted: sum('accepted'), rejected: sum('rejected'), partial: types.some(type => !!type.message), types, recent: recent.sort((a, b) => b.date.localeCompare(a.date) || b.folio - a.folio).slice(0, 8) };
  }
}
