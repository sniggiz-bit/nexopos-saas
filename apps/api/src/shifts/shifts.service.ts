import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftReportService, ShiftSummary } from './shift-report.service';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private shiftReportService: ShiftReportService,
  ) { }

  async openShift(
    tenantId: string,
    branchId: string,
    userId: string,
    initialAmount: number,
  ) {
    // Check if there is already an open shift for this branch
    const existingShift = await this.prisma.cashShift.findFirst({
      where: {
        branchId,
        status: 'OPEN',
      },
    });

    if (existingShift) {
      throw new BadRequestException(
        'There is already an open shift for this branch.',
      );
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

    shift.sales.forEach((sale) => {
      if (sale.status !== 'COMPLETED') return;

      const isRefund = sale.dteType === 61;

      // Count documents
      if (!isRefund) {
        if (sale.dteFolio) {
          dteCount++;
        } else {
          ticketCount++;
        }
      }

      sale.payments.forEach((payment) => {
        const method = payment.paymentMethod as keyof typeof totalsByMethod;
        if (method in totalsByMethod) {
          if (isRefund) {
            totalsByMethod[method] -= payment.amount;
            totalSales -= payment.amount;
          } else {
            totalsByMethod[method] += payment.amount;
            totalSales += payment.amount;
          }
        }
      });
    });

    // Tax calculations (Assuming 19% IVA is included in gross total)
    const totalNet = Math.round(totalSales / 1.19);
    const totalIva = totalSales - totalNet;

    // Expected = Initial + Cash Sales
    const expectedAmount =
      Number(shift.initialAmount) + totalsByMethod.EFECTIVO;
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

    const textReport = this.shiftReportService.generateTextReport(
      summary,
      shift.branch.name,
    );

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

  async getShiftHistory(
    tenantId: string,
    branchId?: string,
    page = 1,
    limit = 20,
    from?: string,
    to?: string,
  ) {
    const where: Record<string, any> = {
      status: 'CLOSED',
      branch: { tenantId },
    };

    if (branchId) where.branchId = branchId;

    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(`${to}T23:59:59`);
    }

    const [total, shifts] = await Promise.all([
      this.prisma.cashShift.count({ where }),
      this.prisma.cashShift.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          openedBy: { select: { name: true, email: true } },
          closedBy: { select: { name: true, email: true } },
          branch: { select: { name: true } },
        },
      }),
    ]);

    return {
      data: shifts,
      total,
      page,
      lastPage: Math.ceil(total / limit) || 1,
    };
  }

  async getShiftSummary(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        sales: { include: { payments: true } },
        openedBy: true,
      },
    });

    if (!shift) throw new NotFoundException('Shift not found');

    const totalsByMethod = { EFECTIVO: 0, DEBITO: 0, CREDITO: 0, TRANSFERENCIA: 0 };
    let totalSales = 0;

    shift.sales.forEach((sale) => {
      if (sale.status !== 'COMPLETED') return;

      const isRefund = sale.dteType === 61;

      sale.payments.forEach((payment) => {
        const method = payment.paymentMethod as keyof typeof totalsByMethod;
        if (method in totalsByMethod) {
          if (isRefund) {
            totalsByMethod[method] -= Number(payment.amount);
            totalSales -= Number(payment.amount);
          } else {
            totalsByMethod[method] += Number(payment.amount);
            totalSales += Number(payment.amount);
          }
        }
      });
    });

    return {
      openedBy: shift.openedBy?.name || shift.openedBy?.email || 'Desconocido',
      initialAmount: Number(shift.initialAmount),
      salesCount: shift.sales.length,
      totalSales,
      paymentMethods: totalsByMethod,
      expectedAmount: Number(shift.initialAmount) + totalsByMethod.EFECTIVO,
    };
  }
}
