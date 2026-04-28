import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { LiorenHelper } from './lioren.helper';

const MOCK_TOKENS = ['TEST_TOKEN', 'YOUR_TOKEN'];

function isMockToken(token: string) {
  return MOCK_TOKENS.some((t) => token.startsWith(t) || token.includes(t));
}

@Injectable()
export class LiorenService {
  private readonly logger = new Logger(LiorenService.name);
  private readonly apiUrl = 'https://lioren.cl/api/dte';
  private readonly apiKey = process.env.LIOREN_API_KEY;
  private readonly defaultToken = process.env.LIOREN_TOKEN;

  constructor(private prisma: PrismaService) {}

  // ─── Public entrypoints ────────────────────────────────────────────────────

  async emitirBoleta(saleId: string) {
    return this._emitir(saleId, 39);
  }

  async emitirFactura(saleId: string) {
    return this._emitir(saleId, 33);
  }

  async emitirNotaCredito(saleId: string) {
    return this._emitir(saleId, 61);
  }

  async emitirGuiaDespacho(saleId: string) {
    return this._emitir(saleId, 52);
  }

  // ─── Core emission ─────────────────────────────────────────────────────────

  private async _emitir(saleId: string, tipodoc: number) {
    const docLabel = this._labelDoc(tipodoc);
    try {
      this.logger.log(`[Lioren] Emitiendo ${docLabel} para venta ${saleId}...`);

      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          tenant: { include: { dteConfig: true } },
        },
      });

      if (!sale) throw new Error(`Venta ${saleId} no encontrada`);

      const token = sale.tenant?.dteConfig?.liorenToken || this.defaultToken || 'TEST_TOKEN_MOCK';

      const detalles = sale.items.map((item) => ({
        nombre: item.product.name,
        cantidad: item.product.unitType === 'WEIGHT'
          ? Number(item.quantity)
          : Math.floor(Number(item.quantity)),
        precio: Math.round(item.price),
      }));

      const mainPayment = sale.payments[0];
      const liorenPayment = LiorenHelper.mapPaymentMethod(mainPayment?.paymentMethod as any);

      const payload: any = {
        token,
        apikey: this.apiKey,
        dte: {
          tipodoc,
          detalles,
          pago: {
            formapago: liorenPayment.formapago,
            mediopago: liorenPayment.mediopago,
            montopago: Math.round(sale.total),
          },
        },
      };

      // Factura Electrónica (33) and Nota de Crédito (61) require receptor
      if ((tipodoc === 33 || tipodoc === 61) && sale.customer) {
        payload.dte.receptor = {
          rut: sale.customer.rut,
          rs: sale.customer.name,
          giro: sale.customer.giro || 'Sin giro',
          dir: sale.customer.address || 'Sin dirección',
          comuna: sale.customer.comuna || 'Santiago',
          ciudad: 'Santiago',
        };
      }

      // Nota de Crédito (61) requires reference to original DTE
      if (tipodoc === 61) {
        const original = await this._findOriginalDte(sale.id);
        if (original) {
          payload.dte.referencia = {
            tipodoc_ref: original.dteType,
            folio_ref: original.dteFolio,
            razon: 'Anulación de documento',
          };
        }
      }

      // Guía de Despacho (52) requires transport info
      if (tipodoc === 52) {
        payload.dte.traslado = {
          tipo_traslado: 1,
          tipo_despacho: 2,
        };
      }

      this.logger.log(`[Lioren] Payload ${docLabel}: ${JSON.stringify(payload)}`);

      let responseData: any;
      if (isMockToken(token) || !this.apiKey) {
        this.logger.log(`[Lioren] MOCK MODE — simulando ${docLabel}`);
        responseData = {
          folio: Math.floor(Math.random() * 90000) + 10000,
          url_pdf: `https://lioren.cl/ver/${this._slugDoc(tipodoc)}/ejemplo-mock`,
        };
      } else {
        const response = await axios.post(this.apiUrl, payload);
        responseData = response.data;
      }

      if (responseData?.folio && responseData?.url_pdf) {
        const { folio, url_pdf } = responseData;
        this.logger.log(`[Lioren] ✅ ${docLabel} emitida: Folio ${folio}`);
        await this.prisma.sale.update({
          where: { id: saleId },
          data: { dteFolio: folio, dtePdfUrl: url_pdf, dteStatus: 'ACEPTADO', dteType: tipodoc },
        });
        return { success: true, folio, url_pdf };
      }

      throw new Error(responseData?.message || 'Respuesta inválida de Lioren');
    } catch (error: any) {
      this.logger.error(`[Lioren] ❌ Error ${docLabel} venta ${saleId}: ${error.message}`);
      await this.prisma.sale
        .update({ where: { id: saleId }, data: { dteStatus: 'ERROR' } })
        .catch(() => null);
      return { success: false, error: error.message };
    }
  }

  // ─── RUT lookup ────────────────────────────────────────────────────────────

  async consultaRut(rut: string) {
    try {
      this.logger.log(`[Lioren] Consultando RUT: ${rut}...`);
      const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
      const payload = { token: this.defaultToken, rut: cleanRut };
      const response = await axios.post('https://lioren.cl/api/rut', payload);
      if (response.data) {
        return {
          success: true,
          data: {
            reasonSocial: response.data.rs,
            giro: response.data.giro,
            address: response.data.dir,
            comuna: response.data.comuna,
            city: response.data.ciudad,
          },
        };
      }
      return { success: false, message: 'No se encontraron datos' };
    } catch (error: any) {
      this.logger.error(`[Lioren] Error consultando RUT: ${error.message}`);
      if (!this.apiKey || isMockToken(this.defaultToken || '')) {
        return {
          success: true,
          data: {
            reasonSocial: 'Empresa de Prueba S.A.',
            giro: 'Venta de software',
            address: 'Av. Providencia 1234',
            comuna: 'Providencia',
            city: 'Santiago',
          },
        };
      }
      return { success: false, error: error.message };
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private _labelDoc(tipodoc: number): string {
    const labels: Record<number, string> = {
      39: 'Boleta Electrónica',
      33: 'Factura Electrónica',
      61: 'Nota de Crédito',
      52: 'Guía de Despacho',
    };
    return labels[tipodoc] ?? `DTE tipo ${tipodoc}`;
  }

  private _slugDoc(tipodoc: number): string {
    const slugs: Record<number, string> = {
      39: 'boleta',
      33: 'factura',
      61: 'nota-credito',
      52: 'guia-despacho',
    };
    return slugs[tipodoc] ?? 'dte';
  }

  private async _findOriginalDte(saleId: string) {
    return this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { dteType: true, dteFolio: true },
    });
  }
}
