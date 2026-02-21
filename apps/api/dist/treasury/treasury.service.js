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
exports.TreasuryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_fns_1 = require("date-fns");
let TreasuryService = class TreasuryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReceivables(tenantId) {
        const credits = await this.prisma.credit.findMany({
            where: {
                tenantId,
                status: 'OPEN',
            },
        });
        const total = credits.reduce((sum, credit) => sum + credit.balance, 0);
        return { total, count: credits.length };
    }
    async getCashFlow(tenantId) {
        const today = new Date();
        const start = (0, date_fns_1.startOfDay)(today);
        const end = (0, date_fns_1.endOfDay)(today);
        const payments = await this.prisma.payment.groupBy({
            by: ['paymentMethod'],
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
                sale: {
                    tenantId: tenantId
                }
            },
            _sum: {
                amount: true,
            },
        });
        return payments.map(p => ({
            method: p.paymentMethod,
            amount: p._sum.amount || 0
        }));
    }
    async getMaturities(tenantId) {
        const today = new Date();
        const nextWeek = (0, date_fns_1.addDays)(today, 7);
        return this.prisma.credit.findMany({
            where: {
                tenantId,
                status: 'OPEN',
                dueDate: {
                    not: null,
                    lte: nextWeek,
                    gte: (0, date_fns_1.startOfDay)(today)
                },
            },
            include: {
                customer: true,
            },
            orderBy: {
                dueDate: 'asc',
            }
        });
    }
};
exports.TreasuryService = TreasuryService;
exports.TreasuryService = TreasuryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TreasuryService);
//# sourceMappingURL=treasury.service.js.map