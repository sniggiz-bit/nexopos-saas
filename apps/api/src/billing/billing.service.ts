import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BillingStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMonthlyBilling() {
    this.logger.debug('Running daily billing check...');

    // Find all tenants that are due for payment today or before
    const dueTenants = await this.prisma.tenant.findMany({
      where: {
        nextPayment: {
          lte: new Date(),
        },
        billingStatus: BillingStatus.ACTIVE,
      },
      include: {
        plan: { include: { planModules: { include: { module: true } } } },
        tenantModuleAddons: { include: { module: true } },
      },
    });

    for (const tenant of dueTenants) {
      try {
        let amount = tenant.plan?.price || 0;
        
        // Add addon costs (simulated at 5000 CLP each)
        amount += tenant.tenantModuleAddons.length * 5000;

        // Create an Invoice
        const invoice = await (this.prisma as any).invoice.create({
          data: {
            tenantId: tenant.id,
            amount,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
          }
        });

        // Simulate payment gateway failure randomly (e.g. 10% chance)
        // Or for now, we will simulate 100% success unless we want to test failures.
        // For testing, let's mark it as failed if their name contains "Demo" just to show the Past Due state.
        const paymentSuccess = !tenant.name.includes('Demo PastDue'); 

        if (!paymentSuccess) {
           await (this.prisma as any).invoice.update({
             where: { id: invoice.id },
             data: { status: 'FAILED' }
           });
           await this.prisma.tenant.update({
             where: { id: tenant.id },
             data: { billingStatus: BillingStatus.PAST_DUE }
           });
           this.logger.warn(`Tenant ${tenant.name} (${tenant.id}) marked as PAST_DUE`);
        } else {
           await (this.prisma as any).invoice.update({
             where: { id: invoice.id },
             data: { status: 'PAID', paidAt: new Date() }
           });
           
           const nextDate = new Date();
           nextDate.setMonth(nextDate.getMonth() + 1);

           await this.prisma.tenant.update({
             where: { id: tenant.id },
             data: { nextPayment: nextDate }
           });
           this.logger.log(`Tenant ${tenant.name} (${tenant.id}) billed successfully for ${amount}`);
        }

      } catch (error: any) {
        this.logger.error(`Error processing billing for tenant ${tenant.id}: ${error.message}`);
      }
    }
  }
}
