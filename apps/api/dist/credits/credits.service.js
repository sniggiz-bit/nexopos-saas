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
exports.CreditsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CreditsService = class CreditsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCreditDto) {
        return this.prisma.credit.create({
            data: createCreditDto,
        });
    }
    async findAll(tenantId, customerId) {
        const where = { tenantId };
        if (customerId) {
            where.customerId = customerId;
        }
        return this.prisma.credit.findMany({
            where,
            include: {
                customer: true,
                sale: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const credit = await this.prisma.credit.findUnique({
            where: { id },
            include: {
                customer: true,
                sale: true,
                payments: true,
            },
        });
        if (!credit) {
            throw new common_1.NotFoundException(`Credit with ID ${id} not found`);
        }
        return credit;
    }
    async addPayment(id, addPaymentDto) {
        const { amount, paymentMethod, cashShiftId } = addPaymentDto;
        const credit = await this.findOne(id);
        if (credit.status === 'PAID') {
            throw new common_1.BadRequestException('Credit is already paid');
        }
        if (amount > credit.balance) {
            throw new common_1.BadRequestException('Payment amount exceeds balance');
        }
        const newBalance = credit.balance - amount;
        const status = newBalance <= 0 ? 'PAID' : 'OPEN';
        return this.prisma.$transaction(async (prisma) => {
            await prisma.creditPayment.create({
                data: {
                    creditId: id,
                    amount,
                    paymentMethod,
                    cashShiftId,
                }
            });
            return prisma.credit.update({
                where: { id },
                data: {
                    balance: newBalance,
                    status,
                },
                include: {
                    payments: true,
                }
            });
        });
    }
};
exports.CreditsService = CreditsService;
exports.CreditsService = CreditsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditsService);
//# sourceMappingURL=credits.service.js.map