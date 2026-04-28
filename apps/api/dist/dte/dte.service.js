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
const lioren_service_1 = require("./lioren.service");
const prisma_service_1 = require("../prisma/prisma.service");
let DteService = class DteService {
    liorenService;
    prisma;
    constructor(liorenService, prisma) {
        this.liorenService = liorenService;
        this.prisma = prisma;
    }
    async emitirDte(saleId) {
        const sale = await this.prisma.sale.findUnique({
            where: { id: saleId },
            select: { dteType: true },
        });
        const tipodoc = sale?.dteType ?? 39;
        switch (tipodoc) {
            case 33:
                return this.liorenService.emitirFactura(saleId);
            case 61:
                return this.liorenService.emitirNotaCredito(saleId);
            case 52:
                return this.liorenService.emitirGuiaDespacho(saleId);
            default:
                return this.liorenService.emitirBoleta(saleId);
        }
    }
};
exports.DteService = DteService;
exports.DteService = DteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lioren_service_1.LiorenService,
        prisma_service_1.PrismaService])
], DteService);
//# sourceMappingURL=dte.service.js.map