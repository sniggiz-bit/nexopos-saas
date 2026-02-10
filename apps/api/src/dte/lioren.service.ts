import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LiorenService {
    private readonly logger = new Logger(LiorenService.name);
    private readonly apiUrl = 'https://lioren.cl/api/dte';

    constructor(private prisma: PrismaService) { }

    /**
     * Emite una boleta electrónica en Lioren
     * @param saleId ID de la venta a emitir
     */
    async emitirBoleta(saleId: string) {
        try {
            this.logger.log(`[Lioren] Iniciando emisión de DTE para venta ${saleId}...`);

            // 1. Obtener la venta con sus items y configuración del tenant
            const sale = await this.prisma.sale.findUnique({
                where: { id: saleId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    tenant: {
                        include: {
                            dteConfig: true,
                        },
                    },
                },
            });

            if (!sale) {
                throw new Error(`Venta ${saleId} no encontrada`);
            }

            const token = sale.tenant?.dteConfig?.liorenToken;
            if (!token) {
                this.logger.warn(`[Lioren] Tenant ${sale.tenantId} no tiene token configurado.`);
                await this.prisma.sale.update({
                    where: { id: saleId },
                    data: { dteStatus: 'ERROR' },
                });
                return { success: false, message: 'DteConfig: liorenToken missing' };
            }

            // 2. Mapear los SaleItems según las reglas de Lioren
            // CRÍTICO: Si el producto es unitType: WEIGHT, envía la cantidad con sus decimales (ej: 0.5). Si es UNIT, envía entero.
            const detalles = sale.items.map((item) => {
                const quantity = Number(item.quantity);
                return {
                    nombre: item.product.name,
                    // Si es UNIT, convertimos a entero. Si es WEIGHT, mantenemos decimales.
                    cantidad: item.product.unitType === 'WEIGHT' ? quantity : Math.floor(quantity),
                    precio: Math.round(item.price), // Lioren espera precios enteros para CLP
                };
            });

            // 3. Preparar el Payload para Lioren
            const payload = {
                token,
                dte: {
                    tipodoc: 39, // Boleta Electrónica
                    detalles,
                },
            };

            this.logger.log(`[Lioren] Enviando solicitud POST a ${this.apiUrl}`);

            // En caso de que Lioren requiera el token en el Header:
            // const response = await axios.post(this.apiUrl, payload.dte, { headers: { Authorization: `Bearer ${token}` } });

            // Según la instrucción, enviamos el payload completo
            const response = await axios.post(this.apiUrl, payload);

            if (response.data && response.data.folio && response.data.url_pdf) {
                const { folio, url_pdf } = response.data;

                this.logger.log(`[Lioren] ✅ DTE emitido: Folio ${folio}`);

                // 4. Actualizar la venta con los datos recibidos
                await this.prisma.sale.update({
                    where: { id: saleId },
                    data: {
                        dteFolio: folio,
                        dtePdfUrl: url_pdf,
                        dteStatus: 'ACEPTADO',
                    },
                });

                return { success: true, folio, url_pdf };
            } else {
                // Si la respuesta no contiene lo esperado, lanzamos error
                const errorMsg = response.data?.message || 'Respuesta inválida de Lioren';
                throw new Error(errorMsg);
            }

        } catch (error) {
            this.logger.error(`[Lioren] ❌ Error emitiendo DTE para venta ${saleId}: ${error.message}`);

            // Si falla, marcamos la venta con ERROR para reintento manual
            await this.prisma.sale.update({
                where: { id: saleId },
                data: { dteStatus: 'ERROR' },
            }).catch(e => this.logger.error(`Error actualizando dteStatus: ${e.message}`));

            return { success: false, error: error.message };
        }
    }
}
