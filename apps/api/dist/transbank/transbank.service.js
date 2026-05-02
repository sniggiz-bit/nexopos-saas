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
var TransbankService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransbankService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const transbank_types_1 = require("./transbank.types");
let TransbankService = TransbankService_1 = class TransbankService {
    prisma;
    logger = new common_1.Logger(TransbankService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordTransaction(dto) {
        const { tenantId, branchId, saleId, orderId, amount, transbankResponse } = dto;
        const existing = await this.prisma.paymentTransaction.findUnique({
            where: { orderId },
        });
        if (existing) {
            this.logger.warn(`Duplicate payment attempt for orderId ${orderId} — returning existing record`);
            return existing;
        }
        const status = transbankResponse.success ? 'APPROVED' : 'REJECTED';
        const safeResponse = {
            responseCode: transbankResponse.responseCode,
            responseMessage: transbankResponse.responseMessage,
            authorizationCode: transbankResponse.authorizationCode,
            cardType: transbankResponse.cardType,
            lastFourDigits: transbankResponse.lastFourDigits,
            ticket: transbankResponse.ticket,
            terminalId: transbankResponse.terminalId ?? null,
            installments: transbankResponse.installments ?? 0,
        };
        const record = await this.prisma.paymentTransaction.create({
            data: {
                tenantId,
                branchId,
                saleId: saleId ?? null,
                orderId,
                amount,
                status: status,
                provider: 'TRANSBANK_POS',
                responseCode: transbankResponse.responseCode,
                authorizationCode: transbankResponse.authorizationCode,
                responseMessage: transbankResponse.responseMessage,
                cardType: transbankResponse.cardType,
                lastFourDigits: transbankResponse.lastFourDigits,
                installments: transbankResponse.installments ?? 0,
                rawResponse: safeResponse,
            },
        });
        this.logger.log(`PaymentTransaction recorded: orderId=${orderId} status=${status} amount=${amount} auth=${transbankResponse.authorizationCode}`);
        return record;
    }
    async findByOrderId(orderId) {
        return this.prisma.paymentTransaction.findUnique({ where: { orderId } });
    }
    async findByTenant(tenantId, limit = 50) {
        return this.prisma.paymentTransaction.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async linkToSale(orderId, saleId) {
        return this.prisma.paymentTransaction.update({
            where: { orderId },
            data: { saleId },
        });
    }
    async getConfig(branchId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
            select: { id: true, name: true, transbankSettings: true },
        });
        return {
            branchId: branch?.id,
            branchName: branch?.name,
            settings: branch?.transbankSettings ?? (0, transbank_types_1.defaultTransbankSettings)(),
        };
    }
    async saveConfig(branchId, settings) {
        await this.prisma.branch.update({
            where: { id: branchId },
            data: { transbankSettings: settings },
        });
        this.logger.log(`Transbank config saved for branch ${branchId}: port=${settings.comPort}`);
        return { ok: true };
    }
};
exports.TransbankService = TransbankService;
exports.TransbankService = TransbankService = TransbankService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransbankService);
//# sourceMappingURL=transbank.service.js.map