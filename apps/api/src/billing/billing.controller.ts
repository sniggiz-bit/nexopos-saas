import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BillingStatus } from '@prisma/client';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('invoices')
  async getInvoices(@Req() req: any) {
    const { tenantId } = req.user;
    return this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('invoices/:id/pay-simulate')
  async payInvoiceSimulate(@Param('id') id: string, @Req() req: any) {
    const { tenantId } = req.user;
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para pagar esta factura.');
    }

    // Process payment internally/simulated:
    // 1. Update Invoice status to PAID
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // 2. Set nextPayment to +30 days from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    // 3. Update Tenant billing status back to ACTIVE
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        billingStatus: BillingStatus.ACTIVE,
        nextPayment: nextDate,
      },
    });

    return {
      success: true,
      message: 'Pago simulado procesado exitosamente',
      invoice: updatedInvoice,
    };
  }
}
