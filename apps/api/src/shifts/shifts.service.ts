
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
    constructor(private prisma: PrismaService) { }

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
                openedBy: userId,
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

        shift.sales.forEach(sale => {
            sale.payments.forEach(payment => {
                const method = payment.paymentMethod as keyof typeof totalsByMethod;
                if (totalsByMethod.hasOwnProperty(method)) {
                    totalsByMethod[method] += payment.amount;
                }
            });
        });

        // Expected = Initial + Cash Sales
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
                // Store totals in metadata or logs if needed, for now we return them
            },
        });
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
