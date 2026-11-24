import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiorenAccountService } from './lioren-account.service';
import { effectiveModuleCodes, moduleTenantInclude } from '../modules/module-access';
import { chileDate, DTE_CODES, DTE_TYPES, LiorenApiError, LiorenApiService, normalizeRut, siiStatus } from './lioren-api.service';
import { BoletaRepresentationError, boletaPrintFormat, readIssuedBoleta, renderBoletaPdf } from './boleta-pdf';

@Injectable()
export class LiorenService {
  private readonly logger = new Logger(LiorenService.name);
  constructor(private prisma: PrismaService, private api: LiorenApiService, private account: LiorenAccountService) {}
  emitirBoleta(id: string) { return this.issue(id, 39); }
  emitirFactura(id: string) { return this.issue(id, 33); }
  emitirNotaCredito(id: string) { return this.issue(id, 61); }
  emitirGuiaDespacho(id: string) { return this.issue(id, 52); }
  async creditNotePreview(saleId: string, tenantId: string) {
    const original = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId }, include: { items: { include: { product: true } }, customer: true, credit: true, branch: true } });
    if (!original) throw new NotFoundException('Venta no encontrada.');
    const existing = await this.prisma.sale.findFirst({ where: { originalSaleId: saleId, tenantId, dteType: 61 }, include: { dteSubmission: { select: { id: true } } } });
    const existingNote = existing ? { id: existing.id, folio: existing.dteFolio, status: existing.status, dteStatus: existing.dteStatus, canVerify: !!existing.dteFolio && !!existing.dteProviderId && !!existing.dteSubmission && existing.status !== 'CREDIT_NOTE' && ['EMITIDO', 'PENDIENTE_SII', 'REPARO', 'ACEPTADO'].includes(existing.dteStatus) } : null;
    const base = { sale: { id: original.id, type: original.dteType, folio: original.dteFolio, total: original.total, createdAt: original.createdAt, branchName: original.branch?.name || null }, existingNote };
    const blocked = (message: string) => ({ ...base, canEmit: false, message });
    if (existing && (existing.dteFolio || existing.dteSubmission || !['PENDING', 'BLOQUEADO'].includes(existing.dteStatus))) return blocked(existing.status === 'CREDIT_NOTE' ? 'La nota de crédito ya fue aceptada y la venta está anulada.' : 'Ya existe una nota de crédito asociada. Revisa su estado; no se creará otro documento.');
    if (![33, 39].includes(original.dteType)) return blocked('Esta acción permite anular una boleta o factura electrónica.');
    if (original.status !== 'COMPLETED' || !original.dteVerifiedAt || !original.dteProviderId || !original.dteFolio || !original.dteIssuedAt || !['ACEPTADO', 'REPARO'].includes(original.dteStatus)) return blocked('La venta debe tener una boleta o factura confirmada en el servicio de facturación. Los tickets internos y registros históricos sin verificar requieren revisión previa.');
    if (original.credit) return blocked('La venta tiene un crédito asociado. Contacta a soporte para revisar su conciliación antes de anularla.');
    if (!original.branch?.isActive) return blocked('La sucursal está deshabilitada. Solicita su habilitación al administrador de la plataforma.');
    try {
      const connection = await this.account.requireEmission(tenantId, 61);
      await this.buildPayload({ ...original, id: existing?.id || original.id, originalSaleId: original.id }, 61, connection.token, connection.status.company.rut);
      return { ...base, canEmit: true, message: 'Se emitirá una nota de crédito por el total del documento original.' };
    } catch (error) {
      return blocked(error instanceof LiorenApiError || error instanceof BadRequestException || error instanceof ForbiddenException ? error.message : 'No se pudo validar la nota de crédito. Reintenta la consulta antes de emitir.');
    }
  }
  private result(sale: any) { return { success: !!sale.dteFolio && !!sale.dteVerifiedAt && !['RECHAZADO', 'REQUIERE_REVISION'].includes(sale.dteStatus), folio: sale.dteFolio || undefined, url_pdf: sale.dtePdfUrl || undefined, status: sale.dteStatus }; }
  async issue(saleId: string, type: number) {
    const sale = await this.prisma.sale.findUnique({ where: { id: saleId }, include: { items: { include: { product: true } }, customer: true, dteSubmission: true } });
    if (!sale) throw new NotFoundException('Venta no encontrada.');
    if (sale.dteType !== type) throw new BadRequestException('El tipo de documento no coincide con la venta.');
    if (sale.dteFolio) return this.result(sale);
    if (sale.dteSubmission || !['PENDING', 'BLOQUEADO'].includes(sale.dteStatus)) return { success: false, status: sale.dteStatus, error: 'Este envío requiere conciliación. No se reemitirá automáticamente.' };
    let connection: Awaited<ReturnType<LiorenAccountService['requireEmission']>>;
    let payload: any;
    try {
      connection = await this.account.requireEmission(sale.tenantId, type);
      payload = await this.buildPayload(sale, type, connection.token, connection.status.company.rut);
    } catch (error) {
      await this.prisma.sale.updateMany({ where: { id: saleId, dteFolio: null, dteStatus: 'PENDING', dteSubmission: { is: null } }, data: { dteStatus: 'BLOQUEADO' } });
      return { success: false, status: 'BLOQUEADO', error: error instanceof LiorenApiError || error instanceof BadRequestException || error instanceof ForbiddenException ? error.message : 'No se pudo validar el documento antes del envío.' };
    }
    const token = connection.token;
    let submission: { id: string; payload: Prisma.JsonValue } | null;
    try { submission = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRawUnsafe('SELECT "id" FROM "Tenant" WHERE "id"=$1 FOR UPDATE', sale.tenantId);
      await tx.$queryRawUnsafe('SELECT "id" FROM "Sale" WHERE "id"=$1 FOR UPDATE', saleId);
      const current = await tx.sale.findUnique({ where: { id: saleId }, include: { dteSubmission: true } });
      if (!current || current.dteSubmission || current.dteFolio || !['PENDING', 'BLOQUEADO'].includes(current.dteStatus)) return null;
      if (current.updatedAt.getTime() !== sale.updatedAt.getTime()) throw new ConflictException('La venta cambió durante la validación. Actualiza antes de continuar.');
      const config = await tx.dteConfig.findUnique({ where: { tenantId: sale.tenantId } });
      if (config?.liorenToken?.trim() !== token || config?.updatedAt.getTime() !== connection.config?.updatedAt.getTime()) throw new ConflictException('La configuración cambió durante la validación. No se envió el documento.');
      const tenant = await tx.tenant.findUnique({ where: { id: sale.tenantId }, include: moduleTenantInclude });
      const catalog = await tx.module.findMany({ select: { code: true, isActive: true } });
      const branch = await tx.branch.findUnique({ where: { id: sale.branchId } });
      if (!tenant || tenant.status !== 'ACTIVE' || tenant.billingStatus !== 'ACTIVE' || normalizeRut(tenant.rut) !== normalizeRut(connection.status.company.rut) || !effectiveModuleCodes(tenant, catalog).includes(DTE_CODES[type]) || !branch?.isActive || branch.tenantId !== sale.tenantId) throw new ForbiddenException('La empresa, sucursal o servicio cambió durante la validación. No se envió el documento.');
      const created = await tx.dteSubmission.create({ data: { id: randomUUID(), saleId, tenantId: sale.tenantId, tokenHash: this.account.fingerprint(token), payload } });
      await tx.sale.update({ where: { id: saleId }, data: { dteStatus: 'ENVIANDO', dteIssuerRut: normalizeRut(connection.status.company.rut) } });
      return created;
    });
    } catch (error) {
      await this.prisma.sale.updateMany({ where: { id: saleId, dteFolio: null, dteStatus: { in: ['PENDING', 'BLOQUEADO'] }, dteSubmission: { is: null } }, data: { dteStatus: 'BLOQUEADO' } }).catch(() => undefined);
      return { success: false, status: 'BLOQUEADO', error: error instanceof ConflictException || error instanceof ForbiddenException ? error.message : 'No se pudo registrar el envío. Actualiza la venta antes de continuar.' };
    }
    if (!submission) return { success: false, status: 'PENDIENTE_CONFIRMACION', error: 'Ya hay un envío registrado. No se duplicará el documento.' };
    try {
      const response = await this.api.issue(token, type, submission.payload as object, submission.id);
      if (!Number.isSafeInteger(Number(response?.folio)) || Number(response.folio) <= 0 || Number(response?.tipodoc) !== type || !response?.id) throw new LiorenApiError(null, true);
      const amountMatches = Number.isFinite(Number(response.montototal)) && Math.abs(Number(response.montototal) - Math.round(sale.total)) <= 1;
      const saved = await this.prisma.sale.update({ where: { id: saleId }, data: {
        dteFolio: Number(response.folio), dteProviderId: String(response.id), dteType: type,
        dteIssuedAt: /^\d{4}-\d{2}-\d{2}$/.test(response.fecha || '') ? new Date(response.fecha + 'T12:00:00Z') : new Date(),
        dteVerifiedAt: new Date(), dteStatus: amountMatches ? siiStatus(response.estado) : 'REQUIERE_REVISION',
        dtePdfUrl: '/api/sales/' + saleId + '/dte/pdf',
      } });
      return { ...this.result(saved), ...(!amountMatches ? { error: 'El servicio de facturación informó un total diferente. El documento existe y requiere revisión; no se reemitirá.' } : {}) };
    } catch (error) {
      const uncertain = !(error instanceof LiorenApiError) || error.uncertain;
      const status = uncertain ? 'PENDIENTE_CONFIRMACION' : 'ERROR';
      await this.prisma.sale.updateMany({ where: { id: saleId, dteFolio: null }, data: { dteStatus: status } }).catch(() => undefined);
      // Neither request headers nor provider error bodies are logged or returned.
      return { success: false, status, error: uncertain ? 'El resultado del envío no está confirmado. Revisa el servicio de facturación antes de cualquier nuevo envío.' : (error as LiorenApiError).message };
    }
  }
  private async buildPayload(sale: any, type: number, token: string, issuerRut: string) {
    if (!sale.items.length || sale.items.length > 60) throw new BadRequestException('El documento debe tener entre 1 y 60 productos.');
    const round = (value: number) => Math.round(value * 1000000) / 1000000;
    const details = sale.items.map((item: any) => {
      const quantity = Number(item.quantity); const price = Number(item.price); const discount = Number(item.discountAmount || 0);
      if (!Number.isFinite(quantity) || quantity < 0.000001 || price < 0 || discount < 0 || discount > price * quantity || item.product?.tenantId !== sale.tenantId || !item.product?.name || item.product.name.length < 3 || item.product.name.length > 80) throw new BadRequestException('Revisa cantidad, nombre, precio y descuento de los productos antes de emitir.');
      return { nombre: item.product.name, cantidad: quantity, precio: type === 39 ? price : round(price / 1.19), exento: false, ...(discount ? { descuento: type === 39 ? discount : round(discount / 1.19), tipodescuento: 1 } : {}) };
    });
    const payload: any = { emisor: { tipodoc: String(type), observaciones: 'NexoPOS ' + sale.id, ...(type === 39 ? { servicio: 3 } : { fecha: chileDate() }) }, detalles: details };
    if (type === 39 && sale.customer) {
      if (sale.customer.tenantId !== sale.tenantId) throw new BadRequestException('El receptor no pertenece a esta empresa.');
      payload.receptor = { rut: normalizeRut(sale.customer.rut), rs: sale.customer.name };
    }
    if (type !== 39) {
      const customer = sale.customer;
      if (!customer || customer.tenantId !== sale.tenantId || !normalizeRut(customer.rut) || !customer.giro || !customer.address || !customer.comuna || !customer.city) throw new BadRequestException('Completa RUT, razón social, giro, dirección, comuna y ciudad del receptor para emitir este documento.');
      const unwrap = (data: any, name: string) => Array.isArray(data) ? data : Array.isArray(data?.[name]) ? data[name] : [];
      const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const communes = unwrap(await this.api.get(token, 'comunas'), 'comunas');
      const commune = communes.find((row: any) => normalize(String(row.nombre)) === normalize(customer.comuna));
      if (!commune) throw new BadRequestException('La comuna del receptor no fue reconocida por el servicio de facturación.');
      const cities = unwrap(await this.api.get(token, 'ciudades', { region_id: commune.region_id }), 'ciudades');
      const city = cities.find((row: any) => normalize(String(row.nombre)) === normalize(customer.city));
      if (!city) throw new BadRequestException('La ciudad del receptor no fue reconocida en la región de su comuna.');
      payload.receptor = { rut: normalizeRut(customer.rut), rs: customer.name, giro: customer.giro, direccion: customer.address, comuna: commune.id, ciudad: city.id };
    }
    if (type === 61) {
      const original = sale.originalSaleId ? await this.prisma.sale.findFirst({ where: { id: sale.originalSaleId, tenantId: sale.tenantId }, include: { dteSubmission: true } }) : null;
      if (!original?.dteFolio || !original.dteVerifiedAt || !original.dteIssuedAt || !['ACEPTADO', 'REPARO'].includes(original.dteStatus)) throw new BadRequestException('La nota de crédito requiere un documento original confirmado y una referencia válida.');
      if (normalizeRut(original.dteIssuerRut) !== normalizeRut(issuerRut)) throw new BadRequestException('El documento original corresponde a otra empresa emisora.');
      const originalPayload = original.dteSubmission?.payload as any;
      if (!originalPayload?.receptor?.rut || normalizeRut(originalPayload.receptor.rut) !== normalizeRut(payload.receptor.rut)) throw new BadRequestException('El receptor debe coincidir con el documento original. Revisa su conciliación.');
      if (originalPayload.receptor.giro && originalPayload.receptor.comuna && originalPayload.receptor.ciudad) payload.receptor = originalPayload.receptor;
      else payload.receptor.rs = originalPayload.receptor.rs;
      const response = await this.api.get(token, 'razonesref');
      const reasons = Array.isArray(response) ? response : response?.razonesref || [];
      const reason = reasons.find((row: any) => /anula/i.test(String(row.nombre)));
      if (!reason?.id) throw new BadRequestException('El servicio de facturación no informó la razón de anulación.');
      payload.referencias = [{ fecha: chileDate(original.dteIssuedAt), tipodoc: String(original.dteType), folio: String(original.dteFolio), razon: reason.id, glosa: 'Anulación del documento original' }];
    }
    if (type === 52) { payload.emisor.tipodespacho = 2; payload.emisor.tipotraslado = 1; }
    return payload;
  }
  async verify(saleId: string, tenantId: string) {
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId }, include: { dteSubmission: true } });
    if (!sale) throw new NotFoundException('Venta no encontrada.');
    if (!sale.dteFolio || !sale.dteProviderId || !sale.dteIssuerRut || !sale.dteSubmission) throw new ConflictException('Este registro necesita conciliación manual. No se asociará ni reemitirá automáticamente.');
    const connection = await this.account.connection(tenantId, true);
    if (!connection.status.connected || normalizeRut(connection.status.company?.rut) !== sale.dteIssuerRut || !connection.status.identityMatches) throw new ForbiddenException('La empresa actual del token no coincide con el emisor del documento.');
    const document = await this.api.document(connection.token, sale.dteType, sale.dteFolio);
    if (String(document.id) !== sale.dteProviderId || !Number.isFinite(Number(document.montototal)) || Math.abs(Number(document.montototal) - Math.round(sale.total)) > 1) throw new ConflictException('El documento consultado no coincide con el envío registrado. Requiere revisión manual.');
    const saved = await this.prisma.sale.update({ where: { id: sale.id }, data: { dteStatus: siiStatus(document.estado), dteVerifiedAt: new Date() } });
    return this.result(saved);
  }
  async documentPdf(tenantId: string, type: number, folio: number) {
    if (!(DTE_TYPES as readonly number[]).includes(type) || !Number.isSafeInteger(folio) || folio <= 0) throw new BadRequestException('Tipo de documento o folio inválido.');
    const connection = await this.account.connection(tenantId);
    if (!connection.status.connected || !connection.status.identityMatches) throw new ForbiddenException('Valida la empresa emisora antes de consultar documentos.');
    const document = await this.api.document(connection.token, type, folio, true);
    return this.api.pdfBuffer(document.pdf);
  }
  async salePdf(saleId: string, user: { tenantId: string; role?: string; branchId?: string }, format?: string) {
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId: user.tenantId } });
    if (!sale || !sale.dteVerifiedAt || !sale.dteProviderId || !sale.dteFolio) throw new NotFoundException('Documento confirmado no encontrado.');
    if (user.role && !['TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role) && sale.branchId !== user.branchId) throw new ForbiddenException('El documento no pertenece a tu sucursal.');
    const connection = await this.account.connection(user.tenantId);
    if (normalizeRut(connection.status.company?.rut) !== sale.dteIssuerRut) throw new ForbiddenException('El token actual no corresponde al emisor de este documento.');
    if (sale.dteType !== 39) return this.documentPdf(user.tenantId, sale.dteType, sale.dteFolio);
    if (!connection.status.connected || !connection.status.identityMatches) throw new ForbiddenException('Valida la empresa emisora antes de consultar documentos.');
    try {
      const printFormat = boletaPrintFormat(format);
      const document = await this.api.document(connection.token, 39, sale.dteFolio, 'xml');
      const boleta = readIssuedBoleta(document, { folio: sale.dteFolio, providerId: sale.dteProviderId, issuerRut: sale.dteIssuerRut!, total: Number(sale.total) });
      const logo = await this.boletaLogo(user.tenantId, connection.config?.liorenLogo);
      return await renderBoletaPdf(boleta, { name: connection.tenant.name, logo, resolution: connection.status.company.resolution, resolutionDate: connection.status.company.resolutionDate }, printFormat);
    } catch (error) {
      if (error instanceof BoletaRepresentationError) throw new BadRequestException(error.message);
      throw error;
    }
  }
  private async boletaLogo(tenantId: string, url?: string | null): Promise<Buffer | undefined> {
    const match = url?.match(/^\/api\/static\/logos\/([a-zA-Z0-9_-]+\.(?:png|jpe?g))$/i);
    if (!match) return;
    const asset = await this.prisma.uploadAsset.findFirst({ where: { tenantId, path: url! } });
    if (!asset) return;
    try {
      const bytes = await readFile(join(process.cwd(), '..', '..', 'uploads', 'logos', match[1]));
      if (bytes.length <= 2 * 1024 * 1024) return bytes;
    } catch { /* Optional branding must not prevent a receipt download. */ }
  }
  async consultarFolios(tenantId: string) { return (await this.account.status(tenantId)).types; }

  async consultaRut(rut: string, _tenantId?: string, allowDevelopmentMock = true) {
    try {
      const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim();
      const dv = cleanRut.slice(-1);
      const cuerpo = cleanRut.slice(0, -1);
      const formattedRut = `${cuerpo}-${dv}`;

      const token = process.env.SRE_TOKEN || 'token_publico';

      this.logger.log(`[RUT Lookup] Consultando RUT ${formattedRut} en SRE con token: ${token === 'token_publico' ? 'publico' : 'personalizado'}`);

      const response = await axios.get('https://sre.cl/api/company_info', {
        params: {
          token,
          rut: formattedRut,
          actualizado: 'False'
        },
        timeout: 10000
      });

      this.logger.log(`[RUT Lookup] Respuesta SRE: ${JSON.stringify(response.data)}`);

      if (response.data && response.data.result) {
        // Fallbacks for common SRE API response structures
        const actividades = response.data.actividades_economicas || response.data.actividades || [];
        const extractedGiro = response.data.glosa_giro 
                           || response.data.giro 
                           || (actividades.length > 0 ? (actividades[0].descripcion || actividades[0].giro || actividades[0].actividad) : '');

        const extractedAddress = response.data.direccion 
                              || response.data.direccion_postal 
                              || response.data.domicilio 
                              || '';

        return {
          success: true,
          data: {
            reasonSocial: response.data.razon_social || response.data.nombre,
            giro: extractedGiro,
            address: extractedAddress,
            comuna: response.data.comuna || response.data.ciudad || response.data.region || '',
            city: response.data.ciudad || response.data.comuna || '',
            _raw: response.data // Agregado temporalmente para poder ver el JSON completo desde el navegador
          },
        };
      }

      const message = response.data?.message || 'Datos no encontrados en el registro de empresas';
      return { success: false, message };
    } catch (error: any) {
      this.logger.error(`[RUT Lookup] Error al consultar RUT: ${error.message}`);
      
      // Fallback a MOCK en desarrollo para no bloquear a los programadores locales
      if (allowDevelopmentMock && process.env.NODE_ENV !== 'production') {
        this.logger.log('[RUT Lookup] MOCK MODE: Devuelto datos de prueba en desarrollo.');
        return {
          success: true,
          data: {
            reasonSocial: 'Empresa de Prueba S.A.',
            giro: 'Venta de software',
            address: 'Av. Providencia 1234',
            comuna: 'Providencia',
            city: 'Santiago',
          }
        };
      }

      const errorMsg = error.response?.data?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

}
