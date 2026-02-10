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
let LiorenService = LiorenService_1 = class LiorenService {
    prisma;
    logger = new common_1.Logger(LiorenService_1.name);
    apiUrl = 'https://lioren.cl/api/dte';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async emitirBoleta(saleId) {
        try {
            this.logger.log(`[Lioren] Iniciando emisión de DTE para venta ${saleId}...`);
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
            const detalles = sale.items.map((item) => {
                const quantity = Number(item.quantity);
                return {
                    nombre: item.product.name,
                    cantidad: item.product.unitType === 'WEIGHT' ? quantity : Math.floor(quantity),
                    precio: Math.round(item.price),
                };
            });
            const payload = {
                token,
                dte: {
                    tipodoc: 39,
                    detalles,
                },
            };
            this.logger.log(`[Lioren] Enviando solicitud POST a ${this.apiUrl}`);
            const response = await axios_1.default.post(this.apiUrl, payload);
            if (response.data && response.data.folio && response.data.url_pdf) {
                const { folio, url_pdf } = response.data;
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
            }
            else {
                const errorMsg = response.data?.message || 'Respuesta inválida de Lioren';
                throw new Error(errorMsg);
            }
        }
        catch (error) {
            this.logger.error(`[Lioren] ❌ Error emitiendo DTE para venta ${saleId}: ${error.message}`);
            await this.prisma.sale.update({
                where: { id: saleId },
                data: { dteStatus: 'ERROR' },
            }).catch(e => this.logger.error(`Error actualizando dteStatus: ${e.message}`));
            return { success: false, error: error.message };
        }
    }
};
exports.LiorenService = LiorenService;
exports.LiorenService = LiorenService = LiorenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LiorenService);
//# sourceMappingURL=lioren.service.js.map