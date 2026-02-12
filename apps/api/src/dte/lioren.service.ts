import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { LiorenHelper, LiorenPayload } from './lioren.helper';

@Injectable()
export class LiorenService {
    private readonly logger = new Logger(LiorenService.name);
    private readonly apiUrl = 'https://lioren.cl/api/dte';

    // credentials from .env
    private readonly apiKey = process.env.LIOREN_API_KEY;
    private readonly defaultToken = process.env.LIOREN_TOKEN;

    constructor(private prisma: PrismaService) { }

    /**
     * Emite una boleta electrónica en Lioren
     * @param saleId ID de la venta a emitir
     */
    async emitirBoleta(saleId: string) {
        try {
            this.logger.log(`[Lioren] Iniciando emisión de DTE para venta ${saleId}...`);

            // 1. Obtener la venta con sus items, pagos y configuración del tenant
            const sale = await this.prisma.sale.findUnique({
                where: { id: saleId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
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

            // Priority: Tenant DTE Config > Env Default Token
            const token = sale.tenant?.dteConfig?.liorenToken || this.defaultToken;

            if (!token) {
                this.logger.warn(`[Lioren] Tenant ${sale.tenantId} no tiene token configurado y no hay token por defecto.`);
                await this.prisma.sale.update({
                    where: { id: saleId },
                    data: { dteStatus: 'ERROR' },
                });
                return { success: false, message: 'DteConfig: liorenToken missing' };
            }

            // 2. Mapear los SaleItems
            const detalles = sale.items.map((item) => {
                const quantity = Number(item.quantity);
                return {
                    nombre: item.product.name,
                    cantidad: item.product.unitType === 'WEIGHT' ? quantity : Math.floor(quantity),
                    precio: Math.round(item.price),
                };
            });

            // 3. Preparar el Pago (usamos el primer método de pago para Lioren)
            const mainPayment = sale.payments[0];
            const liorenPayment = LiorenHelper.mapPaymentMethod(mainPayment?.paymentMethod as any);

            // 4. Preparar el Payload para Lioren
            const payload: any = {
                token,
                apikey: this.apiKey, // Added API Key from Env
                dte: {
                    tipodoc: 39, // Boleta Electrónica
                    detalles,
                    pago: {
                        formapago: liorenPayment.formapago,
                        mediopago: liorenPayment.mediopago,
                        montopago: Math.round(sale.total)
                    }
                },
            };

            this.logger.log(`[Lioren] Payload: ${JSON.stringify(payload)}`);

            // MOCK MODE: If token is a test token or starts with YOUR_
            let responseData;
            if (token.startsWith('TEST_TOKEN') || token.includes('YOUR_TOKEN')) {
                this.logger.log(`[Lioren] MOCK MODE: Simulando emisión exitosa.`);
                responseData = {
                    folio: Math.floor(Math.random() * 10000) + 1,
                    url_pdf: 'https://lioren.cl/ver/boleta/ejemplo-mock',
                };
            } else {
                const response = await axios.post(this.apiUrl, payload);
                responseData = response.data;
            }

            if (responseData && responseData.folio && responseData.url_pdf) {
                const { folio, url_pdf } = responseData;
                this.logger.log(`[Lioren] ✅ DTE emitido: Folio ${folio}`);

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
                const errorMsg = responseData?.message || 'Respuesta inválida de Lioren';
                throw new Error(errorMsg);
            }

        } catch (error) {
            this.logger.error(`[Lioren] ❌ Error emitiendo DTE para venta ${saleId}: ${error.message}`);
            await this.prisma.sale.update({
                where: { id: saleId },
                data: { dteStatus: 'ERROR' },
            }).catch(e => this.logger.error(`Error actualizando dteStatus: ${e.message}`));

            return { success: false, error: error.message };
        }
    }
}
