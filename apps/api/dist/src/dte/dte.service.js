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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DteService = class DteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async emitirDte(saleId) {
        console.log(`[DTE Service] Iniciando emisión de DTE para venta ${saleId}...`);
        await this.delay(1000);
        const folio = this.generateRandomFolio();
        const updatedSale = await this.prisma.sale.update({
            where: { id: saleId },
            data: {
                dteFolio: folio,
                dteStatus: 'ACEPTADO',
            },
        });
        console.log(`[DTE Service] ✅ DTE emitido exitosamente. Folio: ${folio}, Status: ACEPTADO`);
        return {
            success: true,
            folio,
            status: 'ACEPTADO',
            saleId,
            message: 'DTE emitido correctamente (MOCK)',
        };
    }
    generateRandomFolio() {
        return Math.floor(Math.random() * (9999 - 5001 + 1)) + 5001;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.DteService = DteService;
exports.DteService = DteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DteService);
//# sourceMappingURL=dte.service.js.map