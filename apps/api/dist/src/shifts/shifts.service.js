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
exports.ShiftsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ShiftsService = class ShiftsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async openShift(tenantId, branchId, userId, initialAmount) {
        const existingShift = await this.prisma.cashShift.findFirst({
            where: {
                branchId,
                status: 'OPEN',
            },
        });
        if (existingShift) {
            throw new common_1.BadRequestException('There is already an open shift for this branch.');
        }
        return this.prisma.cashShift.create({
            data: {
                branchId,
                openedBy: userId,
                initialAmount,
                status: 'OPEN',
                startTime: new Date(),
            },
        });
    }
    async closeShift(shiftId, userId, finalAmount) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: {
                sales: {
                    include: {
                        payments: true,
                    },
                },
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        if (shift.status !== 'OPEN') {
            throw new common_1.BadRequestException('Shift is already closed');
        }
        const totalsByMethod = {
            EFECTIVO: 0,
            DEBITO: 0,
            CREDITO: 0,
            TRANSFERENCIA: 0,
        };
        shift.sales.forEach(sale => {
            sale.payments.forEach(payment => {
                const method = payment.paymentMethod;
                if (totalsByMethod.hasOwnProperty(method)) {
                    totalsByMethod[method] += payment.amount;
                }
            });
        });
        const expectedAmount = Number(shift.initialAmount) + totalsByMethod.EFECTIVO;
        const difference = finalAmount - expectedAmount;
        return this.prisma.cashShift.update({
            where: { id: shiftId },
            data: {
                endTime: new Date(),
                closedBy: userId,
                finalAmount,
                expectedAmount,
                difference,
                status: 'CLOSED',
            },
        });
    }
    async getCurrentShift(branchId) {
        return this.prisma.cashShift.findFirst({
            where: {
                branchId,
                status: 'OPEN',
            },
        });
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftsService);
//# sourceMappingURL=shifts.service.js.map