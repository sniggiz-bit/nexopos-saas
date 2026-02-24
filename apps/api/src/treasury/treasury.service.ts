import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, addDays } from 'date-fns';

@Injectable()
export class TreasuryService {
  constructor(private prisma: PrismaService) {}

  async getReceivables(tenantId: string) {
    const credits = await this.prisma.credit.findMany({
      where: {
        tenantId,
        status: 'OPEN',
      },
    });

    const total = credits.reduce((sum, credit) => sum + credit.balance, 0);
    return { total, count: credits.length };
  }

  async getCashFlow(tenantId: string) {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Group payments by method for today's sales
    const payments = await this.prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        sale: {
          tenantId: tenantId,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return payments.map((p) => ({
      method: p.paymentMethod,
      amount: p._sum.amount || 0,
    }));
  }

  async getMaturities(tenantId: string) {
    const today = new Date();
    const nextWeek = addDays(today, 7);

    // Find credits due soon
    return this.prisma.credit.findMany({
      where: {
        tenantId,
        status: 'OPEN',
        dueDate: {
          // If dueDate is null, it's not "maturing" in a scheduled way, or maybe it's immediately due?
          // Assuming we only check set dueDates.
          not: null,
          lte: nextWeek,
          gte: startOfDay(today), // Don't show past due here? Or show all past due + upcoming?
          // "Próximos Vencimientos" usually implies upcoming. Past due is "Vencidos".
          // Let's show everything from today onwards that is due.
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }
}
