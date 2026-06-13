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

      const token = sale.tenant?.dteConfig?.liorenToken || this.defaultToken;
      if (!token) throw new Error('Token de Lioren no configurado');

      const detalles = sale.items.map((item) => ({
        nombre: item.product.name,
        cantidad: item.product.unitType === 'WEIGHT'
          ? Number(item.quantity)
          : Math.floor(Number(item.quantity)),
        precio: Math.round(item.price),
        exento: false
      }));

      const mainPayment = sale.payments[0];
      const liorenPayment = LiorenHelper.mapPaymentMethod(mainPayment?.paymentMethod as any);

      // Construct flat payload
      const payload: any = {
        emisor: {
          tipodoc: String(tipodoc),
          servicio: 1,
        },
        detalles,
        pago: {
          formapago: liorenPayment.formapago,
          mediopago: liorenPayment.mediopago,
          montopago: Math.round(sale.total),
        },
      };

      // emisor.fecha is required for non-boletas (33, 52, 61)
      if (tipodoc !== 39) {
        payload.emisor.fecha = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
      }

      // Factura (33) and Nota de Crédito (61) require receptor
      if (tipodoc === 33 || tipodoc === 61) {
        if (!sale.customer) throw new Error(`Venta ${saleId} requiere receptor para ${docLabel}`);
        
        let comunaId = 295; // Default: Santiago Comuna ID 295
        let ciudadId = 176; // Default: Santiago Ciudad ID 176

        if (!isMockToken(token)) {
          try {
            // Fetch comunas list from Lioren
            const comunasRes = await axios.get('https://www.lioren.cl/api/comunas', {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 5000
            });
            const comunas = Array.isArray(comunasRes.data) ? comunasRes.data : [];
            const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

            if (sale.customer.comuna) {
              const customerComunaNorm = normalize(sale.customer.comuna);
              const matchedComuna = comunas.find(c => normalize(c.nombre) === customerComunaNorm);
              if (matchedComuna) comunaId = matchedComuna.id;
            }

            // Fetch ciudades list from Lioren
            const ciudadesRes = await axios.get('https://www.lioren.cl/api/ciudades', {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 5000
            });
            const ciudades = Array.isArray(ciudadesRes.data) ? ciudadesRes.data : [];

            if (sale.customer.comuna) {
              const customerCityNorm = normalize(sale.customer.comuna);
              const matchedCiudad = ciudades.find(c => normalize(c.nombre) === customerCityNorm);
              if (matchedCiudad) ciudadId = matchedCiudad.id;
            }
          } catch (geoErr: any) {
            this.logger.warn(`[Lioren] Error mapping comuna/ciudad IDs, using defaults: ${geoErr.message}`);
          }
        }

        payload.receptor = {
          rut: sale.customer.rut,
          rs: sale.customer.name,
          giro: sale.customer.giro || 'Sin giro',
          direccion: sale.customer.address || 'Sin dirección',
          comuna: comunaId,
          ciudad: ciudadId,
        };
      }

      // ── Referencia (Nota de Crédito 61) ────────────────────────────────────
      if (tipodoc === 61) {
        const originalId = (sale as any).originalSaleId || saleId;
        const originalDte = await this.prisma.sale.findUnique({
          where: { id: originalId },
          select: { dteType: true, dteFolio: true },
        });

        if (originalDte?.dteFolio) {
          payload.referencias = [
            {
              tipodoc_ref: String(originalDte.dteType),
              folio_ref: originalDte.dteFolio,
              razon: 'Anulación de documento',
            }
          ];
        } else {
          this.logger.warn(
            `[Lioren] Nota de Crédito para venta ${saleId}: ` +
            `no se encontró folio en venta original ${originalId}. Emitiendo sin referencia.`,
          );
        }
      }

      // Guía de Despacho (52) requires transport info
      if (tipodoc === 52) {
        payload.traslado = {
          tipo_traslado: 1,
          tipo_despacho: 2,
        };
      }

      let responseData: any;
      if (isMockToken(token)) {
        this.logger.log(`[Lioren] MOCK MODE — simulando ${docLabel}`);
        responseData = {
          folio: Math.floor(Math.random() * 90000) + 10000,
          pdf: `https://lioren.cl/ver/${this._slugDoc(tipodoc)}/ejemplo-mock`,
        };
      } else {
        const url = tipodoc === 39 ? 'https://www.lioren.cl/api/boletas' : 'https://www.lioren.cl/api/dtes';
        this.logger.log(`[Lioren] Enviando POST a ${url}`);
        const response = await axios.post(url, payload, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 20000,
        });
        responseData = response.data;
      }

      if (responseData?.folio) {
        const folio = responseData.folio;
        const pdfUrl = responseData.pdf || responseData.url_pdf || `https://lioren.cl/ver/${this._slugDoc(tipodoc)}/ejemplo-mock`;
        this.logger.log(`[Lioren] ✅ ${docLabel} emitida: Folio ${folio}`);
        await this.prisma.sale.update({
          where: { id: saleId },
          data: {
            dteFolio: Number(folio),
            dtePdfUrl: pdfUrl,
            dteStatus: 'ACEPTADO',
            dteType: tipodoc,
          },
        });
        return { success: true, folio: Number(folio), url_pdf: pdfUrl };
      }

      throw new Error(responseData?.message || 'Respuesta inválida de Lioren API');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.response?.data?.errors 
        ? JSON.stringify(error.response.data) 
        : error.message;
      this.logger.error(`[Lioren] ❌ Error ${docLabel} (Venta ${saleId}): ${errMsg}`);
      await this.prisma.sale
        .update({ where: { id: saleId }, data: { dteStatus: 'ERROR' } })
        .catch(() => null);
      return { success: false, error: errMsg };
    }
  }

  // ─── RUT lookup ────────────────────────────────────────────────────────────

  async consultaRut(rut: string, tenantId?: string) {
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

      if (response.data && response.data.result) {
        return {
          success: true,
          data: {
            reasonSocial: response.data.razon_social,
            giro: response.data.glosa_giro,
            address: response.data.direccion,
            comuna: response.data.ciudad || response.data.comuna,
            city: response.data.ciudad,
          },
        };
      }

      const message = response.data?.message || 'Datos no encontrados en el registro de empresas';
      return { success: false, message };
    } catch (error: any) {
      this.logger.error(`[RUT Lookup] Error al consultar RUT: ${error.message}`);
      
      // Fallback a MOCK en desarrollo para no bloquear a los programadores locales
      if (process.env.NODE_ENV !== 'production') {
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

  // ─── Consulta folios disponibles (CAF) ────────────────────────────────────

  async consultarFolios(tenantId: string): Promise<{ tipodoc: number; label: string; disponibles: number; ultimoFolio: number }[]> {
    const docLabels: Record<number, string> = {
      39: 'Boleta Electrónica',
      33: 'Factura Electrónica',
      61: 'Nota de Crédito',
      52: 'Guía de Despacho',
    };
    try {
      const config = await this.prisma.dteConfig.findUnique({ where: { tenantId } });
      const token = config?.liorenToken || this.defaultToken;
      if (!token || isMockToken(token)) {
        // Datos de prueba en modo mock
        return [
          { tipodoc: 39, label: 'Boleta Electrónica', disponibles: 500, ultimoFolio: 1000 },
          { tipodoc: 33, label: 'Factura Electrónica', disponibles: 200, ultimoFolio: 500 },
          { tipodoc: 61, label: 'Nota de Crédito', disponibles: 100, ultimoFolio: 200 },
          { tipodoc: 52, label: 'Guía de Despacho', disponibles: 150, ultimoFolio: 300 },
        ];
      }

      const docTypes = [39, 33, 61, 52];
      const results = await Promise.all(
        docTypes.map(async (tipodoc) => {
          try {
            const response = await axios.get('https://www.lioren.cl/api/cafs', {
              params: { tipodoc },
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              timeout: 10000
            });
            const cafs = Array.isArray(response.data) ? response.data : [];
            let disponibles = 0;
            let maxFolio = 0;
            let minDesde = Infinity;

            for (const caf of cafs) {
              disponibles += Number(caf.libres || 0);
              const desde = Number(caf.desde);
              const asignados = Number(caf.asignados || 0);
              if (desde < minDesde) {
                minDesde = desde;
              }
              if (asignados > 0) {
                const lastInCaf = desde + asignados - 1;
                if (lastInCaf > maxFolio) {
                  maxFolio = lastInCaf;
                }
              }
            }

            const ultimoFolio = maxFolio > 0 ? maxFolio : (minDesde !== Infinity ? minDesde - 1 : 0);

            return {
              tipodoc,
              label: docLabels[tipodoc],
              disponibles,
              ultimoFolio
            };
          } catch (err: any) {
            this.logger.error(`[Lioren] Error consultando CAFs para tipodoc ${tipodoc}: ${err.message}`);
            return {
              tipodoc,
              label: docLabels[tipodoc],
              disponibles: 0,
              ultimoFolio: 0
            };
          }
        })
      );

      return results;
    } catch (error: any) {
      this.logger.error(`[Lioren] Error general consultando folios: ${error.message}`);
      return [];
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
