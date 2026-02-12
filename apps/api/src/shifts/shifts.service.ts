
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftReportService, ShiftSummary } from './shift-report.service';

@Injectable()
export class ShiftsService {
    constructor(
        private prisma: PrismaService,
        private shiftReportService: ShiftReportService
    ) { }

    async openShift(tenantId: string, branchId: string, userId: string, initialAmount: number) {
        // Check if there is already an open shift for this branch
        const existingShift = await this.prisma.cashShift.findFirst({
            where: {
                branchId,
                status: 'OPEN',
            },
        });

        if (existingShift) {
            throw new BadRequestException('There is already an open shift for this branch.');
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

    async closeShift(shiftId: string, userId: string, finalAmount: number) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: {
                sales: {
                    include: {
                        payments: true,
                    },
                },
                branch: true,
                openedBy: true, // Include User relation
            },
        });

        if (!shift) {
            throw new NotFoundException('Shift not found');
        }

        if (shift.status !== 'OPEN') {
            throw new BadRequestException('Shift is already closed');
        }

        // Calculate totals per payment method
        const totalsByMethod = {
            EFECTIVO: 0,
            DEBITO: 0,
            CREDITO: 0,
            TRANSFERENCIA: 0,
        };

        let totalSales = 0;
        let dteCount = 0;
        let ticketCount = 0;

        shift.sales.forEach(sale => {
            // Count documents
            if (sale.dteFolio) {
                dteCount++;
            } else {
                ticketCount++;
            }

            sale.payments.forEach(payment => {
                const method = payment.paymentMethod as keyof typeof totalsByMethod;
                if (totalsByMethod.hasOwnProperty(method)) {
                    totalsByMethod[method] += payment.amount;
                }
                totalSales += payment.amount;
            });
        });

        // Tax calculations (Assuming 19% IVA is included in gross total)
        const totalNet = Math.round(totalSales / 1.19);
        const totalIva = totalSales - totalNet;

        // Expected = Initial + Cash Sales
        const expectedAmount = Number(shift.initialAmount) + totalsByMethod.EFECTIVO;
        const difference = finalAmount - expectedAmount;

        // Get closer name (current user) - ideally we should fetch the user, but for now we might use ID or fetch it.
        // Let's fetch the user to get the name for the report
        const closer = await this.prisma.user.findUnique({ where: { id: userId } });

        const summary: ShiftSummary = {
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
                metadata: summary as any, // Store summary in JSON field
            },
        });

        return {
            shift: updatedShift,
            textReport,
        };
    }

    async getCurrentShift(branchId: string) {
        return this.prisma.cashShift.findFirst({
            where: {
                branchId,
                status: 'OPEN',
            },
        });
    }
}
