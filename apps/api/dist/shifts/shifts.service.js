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
const shift_report_service_1 = require("./shift-report.service");
let ShiftsService = class ShiftsService {
    prisma;
    shiftReportService;
    constructor(prisma, shiftReportService) {
        this.prisma = prisma;
        this.shiftReportService = shiftReportService;
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
                openedById: userId,
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
                branch: true,
                openedBy: true,
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
        let totalSales = 0;
        let dteCount = 0;
        let ticketCount = 0;
        shift.sales.forEach((sale) => {
            if (sale.dteFolio) {
                dteCount++;
            }
            else {
                ticketCount++;
            }
            sale.payments.forEach((payment) => {
                const method = payment.paymentMethod;
                if (method in totalsByMethod) {
                    totalsByMethod[method] += payment.amount;
                }
                totalSales += payment.amount;
            });
        });
        const totalNet = Math.round(totalSales / 1.19);
        const totalIva = totalSales - totalNet;
        const expectedAmount = Number(shift.initialAmount) + totalsByMethod.EFECTIVO;
        const difference = finalAmount - expectedAmount;
        const closer = await this.prisma.user.findUnique({ where: { id: userId } });
        const summary = {
            shiftId: shift.id,
            openedBy: shift.openedBy.name || shift.openedBy.email,
            closedBy: closer?.name || closer?.email || userId,
            startTime: shift.startTime,
            endTime: new Date(),
            initialAmount: Number(shift.initialAmount),
            finalAmount,
            expectedAmount,
            difference,
            totalSales,
            paymentMethods: totalsByMethod,
            taxSummary: {
                totalNet,
                totalIva,
                totalGross: totalSales,
            },
            documents: {
                dtes: dteCount,
                tickets: ticketCount,
            },
        };
        const textReport = this.shiftReportService.generateTextReport(summary, shift.branch.name);
        const updatedShift = await this.prisma.cashShift.update({
            where: { id: shiftId },
            data: {
                endTime: summary.endTime,
                closedById: userId,
                finalAmount,
                expectedAmount,
                difference,
                status: 'CLOSED',
                metadata: summary,
            },
        });
        return {
            shift: updatedShift,
            textReport,
        };
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        shift_report_service_1.ShiftReportService])
], ShiftsService);
//# sourceMappingURL=shifts.service.js.map