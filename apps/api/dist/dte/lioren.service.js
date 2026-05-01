"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LiorenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiorenService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../prisma/prisma.service");
const lioren_helper_1 = require("./lioren.helper");
const MOCK_TOKENS = ['TEST_TOKEN', 'YOUR_TOKEN'];
function isMockToken(token) {
    return MOCK_TOKENS.some((t) => token.startsWith(t) || token.includes(t));
}
let LiorenService = LiorenService_1 = class LiorenService {
    prisma;
    logger = new common_1.Logger(LiorenService_1.name);
    apiUrl = 'https://lioren.cl/api/dte';
    apiKey = process.env.LIOREN_API_KEY;
    defaultToken = process.env.LIOREN_TOKEN;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async emitirBoleta(saleId) {
        return this._emitir(saleId, 39);
    }
    async emitirFactura(saleId) {
        return this._emitir(saleId, 33);
    }
    async emitirNotaCredito(saleId) {
        return this._emitir(saleId, 61);
    }
    async emitirGuiaDespacho(saleId) {
        return this._emitir(saleId, 52);
    }
    async _emitir(saleId, tipodoc) {
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
            if (!sale)
                throw new Error(`Venta ${saleId} no encontrada`);
            const token = sale.tenant?.dteConfig?.liorenToken || this.defaultToken || 'TEST_TOKEN_MOCK';
            const detalles = sale.items.map((item) => ({
                nombre: item.product.name,
                cantidad: item.product.unitType === 'WEIGHT'
                    ? Number(item.quantity)
                    : Math.floor(Number(item.quantity)),
                precio: Math.round(item.price),
            }));
            const mainPayment = sale.payments[0];
            const liorenPayment = lioren_helper_1.LiorenHelper.mapPaymentMethod(mainPayment?.paymentMethod);
            const payload = {
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
            if (tipodoc === 52) {
                payload.dte.traslado = {
                    tipo_traslado: 1,
                    tipo_despacho: 2,
                };
            }
            this.logger.log(`[Lioren] Payload ${docLabel}: ${JSON.stringify(payload)}`);
            let responseData;
            if (isMockToken(token) || !this.apiKey) {
                this.logger.log(`[Lioren] MOCK MODE — simulando ${docLabel}`);
                responseData = {
                    folio: Math.floor(Math.random() * 90000) + 10000,
                    url_pdf: `https://lioren.cl/ver/${this._slugDoc(tipodoc)}/ejemplo-mock`,
                };
            }
            else {
                const response = await axios_1.default.post(this.apiUrl, payload);
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
        }
        catch (error) {
            this.logger.error(`[Lioren] ❌ Error ${docLabel} venta ${saleId}: ${error.message}`);
            await this.prisma.sale
                .update({ where: { id: saleId }, data: { dteStatus: 'ERROR' } })
                .catch(() => null);
            return { success: false, error: error.message };
        }
    }
    async consultaRut(rut) {
        try {
            this.logger.log(`[Lioren] Consultando RUT: ${rut}...`);
            const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
            const payload = { token: this.defaultToken, rut: cleanRut };
            const response = await axios_1.default.post('https://lioren.cl/api/rut', payload);
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
        }
        catch (error) {
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
    _labelDoc(tipodoc) {
        const labels = {
            39: 'Boleta Electrónica',
            33: 'Factura Electrónica',
            61: 'Nota de Crédito',
            52: 'Guía de Despacho',
        };
        return labels[tipodoc] ?? `DTE tipo ${tipodoc}`;
    }
    _slugDoc(tipodoc) {
        const slugs = {
            39: 'boleta',
            33: 'factura',
            61: 'nota-credito',
            52: 'guia-despacho',
        };
        return slugs[tipodoc] ?? 'dte';
    }
    async _findOriginalDte(saleId) {
        return this.prisma.sale.findUnique({
            where: { id: saleId },
            select: { dteType: true, dteFolio: true },
        });
    }
};
exports.LiorenService = LiorenService;
exports.LiorenService = LiorenService = LiorenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LiorenService);
//# sourceMappingURL=lioren.service.js.map