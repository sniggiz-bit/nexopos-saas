import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
import { CreditsService } from '../credits/credits.service';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '@prisma/client';

interface GetSalesFilters {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  tenantId?: string;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private dteService: DteService,
    private internalReceiptService: InternalReceiptService,
    private creditsService: CreditsService,
    private inventoryService: InventoryService,
  ) {}

  /**
   * Get all sales with optional filters
   */
  async getSales(filters: GetSalesFilters = {}) {
    const { startDate, endDate, branchId, tenantId } = filters;
    const where: any = {};

    if (tenantId) where.tenantId = tenantId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (branchId) where.branchId = branchId;

    return this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        branch: true,
        user: true,
        customer: true,
        credit: true,
      },
    });
  }

  async createSale(createSaleDto: CreateSaleDto) {
    this.logger.log(
      `Starting createSale with DTO: ${JSON.stringify(createSaleDto, null, 2)}`,
    );
    const {
      tenantId,
      branchId,
      userId,
      items,
      payments,
      status = 'COMPLETED',
      customerId,
      quoteId,
    } = createSaleDto;

    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    if (!branchId) {
      throw new BadRequestException(
        'branchId is required. Ensure your user is assigned to a branch.',
      );
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('Sale must contain at least one item');
    }

    // Logic for Pre-sales:
    // - Allow 0 payments if PRE_SALE
    if (status === 'COMPLETED') {
      if (!payments || payments.length === 0) {
        throw new BadRequestException(
          'Sale must contain at least one payment method',
        );
      }
    }

    // Validate Credit Payment
    const hasCreditPayment = payments?.some(
      (p) => p.paymentMethod === 'CREDITO',
    );
    if (hasCreditPayment && !customerId) {
      throw new BadRequestException('Customer is required for CREDIT payments');
    }

    const sale = await this.prisma.$transaction(async (prisma) => {
      // 1. Validate products
      const productIds = items.map((item) => item.productId);
      console.log(`[SalesService] Creating sale for tenant: ${tenantId}, branch: ${branchId}`);
      console.log(`[SalesService] Requested product IDs:`, productIds);

      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });

      console.log(`[SalesService] Found products in DB:`, products.map(p => ({ id: p.id, tenantId: p.tenantId })));

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        console.error(`[SalesService] Products mismatch! Missing:`, missingIds);
        throw new BadRequestException(`Some products were not found: ${missingIds.join(', ')}`);
      }

      // 1.5. Validate Open Shift
      const currentShift = await prisma.cashShift.findFirst({
        where: { branchId, status: 'OPEN' },
      });

      if (!currentShift) {
        throw new BadRequestException(
          'No open shift found. Please open a shift first.',
        );
      }

      const productMap = new Map<string, any>(products.map((p) => [p.id, p]));

      // 2. Validate and Update Stock
      for (const item of items) {
        const inventory = await prisma.inventory.findUnique({
          where: {
            productId_branchId: { productId: item.productId, branchId },
          },
        });

        if (!inventory || inventory.quantity.lessThan(item.quantity)) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}`,
          );
        }

        await this.inventoryService.logMovement(
          {
            productId: item.productId,
            branchId,
            quantity: -Number(item.quantity), // Negative for sale (OUT)
            type: MovementType.SALE,
            reference: `Venta`, // We don't have the Sale ID yet, maybe update later or use "Pending"
            userId,
          },
          prisma,
        );

        // InventoryLevel update is handled by logMovement
      }

      // 3. Calculate Total and Total Discount
      let totalDiscount = 0;
      const total = items.reduce((acc, item) => {
        const product = productMap.get(item.productId);
        const linePrice = item.price ?? Number(product?.price || 0);
        const discount = item.discountAmount ?? 0;
        totalDiscount += discount;
        return acc + (linePrice * Number(item.quantity)) - discount;
      }, 0);

      // 4. Validate Payments (only for COMPLETED)
      if (status === 'COMPLETED') {
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        if (Math.abs(totalPaid - total) > 0.01) {
          throw new BadRequestException(
            `Paid amount ($${totalPaid}) does not match total ($${total})`,
          );
        }
      }

      // 5. Create Sale
      const createdSale = await prisma.sale.create({
        data: {
          tenantId,
          branchId,
          userId,
          cashShiftId: currentShift.id,
          total,
          discountAmount: totalDiscount,
          status,
          customerId,
          quoteId,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId);
              const linePrice = item.price ?? Number(product?.price || 0);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: linePrice,
                discountAmount: item.discountAmount ?? 0,
              };
            }),
          },
          payments: {
            create: payments?.map((p) => ({
              paymentMethod: p.paymentMethod,
              amount: p.amount,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
        },
      });

      // 6. Handling Credit Creation
      if (status === 'COMPLETED' && hasCreditPayment) {
        const creditAmount = payments
          .filter((p) => p.paymentMethod === 'CREDITO')
          .reduce((acc, p) => acc + p.amount, 0);

        await prisma.credit.create({
          data: {
            tenantId,
            customerId: customerId!,
            saleId: createdSale.id,
            totalAmount: creditAmount,
            balance: creditAmount,
            status: 'OPEN',
          },
        });
      }

      // 7. Update Movement References (Async or inside transaction if vital)
      // Since we created movements with placeholder reference, strict audit might require Sale ID.
      // Using `updateMany` inside transaction to link movements to this sale is good practice.
      // However, StockMovement doesn't have saleId field in our current schema plan, it uses `reference` string.
      // We can update the reference now that we have the Sale ID.
      await prisma.stockMovement.updateMany({
        where: {
          reference: 'Venta',
          productId: { in: items.map((i) => i.productId) },
          branchId,
          createdAt: { gte: new Date(Date.now() - 5000) }, // Safety window to match recent movements
        },
        data: { reference: `SALE-${createdSale.id}` },
      });

      return createdSale;
    });

    // Post-Sale Actions (DTE, etc)
    if (sale.status === 'COMPLETED') {
      this.emitDteAndReceipt(sale.id);
    }

    return sale;
  }

  async completePreSale(id: string, payments: CreatePaymentDto[]) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== 'PRE_SALE')
      throw new BadRequestException('Sale is not a pre-sale');

    // Validate Payments matching total
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    if (Math.abs(totalPaid - sale.total) > 0.01) {
      throw new BadRequestException(
        `Paid amount ($${totalPaid}) does not match total ($${sale.total})`,
      );
    }

    // Validate Credit
    const hasCreditPayment = payments.some(
      (p) => p.paymentMethod === 'CREDITO',
    );
    if (hasCreditPayment && !sale.customerId) {
      throw new BadRequestException('Customer is required for CREDIT payments');
    }

    await this.prisma.$transaction(async (prisma) => {
      // 1. Add payments
      await prisma.payment.createMany({
        data: payments.map((p) => ({
          saleId: id,
          amount: p.amount,
          paymentMethod: p.paymentMethod as any, // Cast enum
        })),
      });

      // 2. Update status
      await prisma.sale.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      // 3. Create Credit if needed
      if (hasCreditPayment) {
        const creditAmount = payments
          .filter((p) => p.paymentMethod === 'CREDITO')
          .reduce((acc, p) => acc + p.amount, 0);

        await prisma.credit.create({
          data: {
            tenantId: sale.tenantId,
            customerId: sale.customerId!,
            saleId: sale.id,
            totalAmount: creditAmount,
            balance: creditAmount,
            status: 'OPEN',
          },
        });
      }
    });

    // Emit DTE/Receipt
    this.emitDteAndReceipt(id);

    return this.prisma.sale.findUnique({
      where: { id },
      include: { items: true, payments: true, customer: true, credit: true },
    });
  }

  private async emitDteAndReceipt(saleId: string) {
    try {
      await this.dteService.emitirDte(saleId);
    } catch (e) {
      this.logger.error(`Failed to emit DTE for sale ${saleId}`, e);
    }

    try {
      await this.internalReceiptService.generateReceipt(saleId);
    } catch (e) {
      this.logger.error(`Failed to generate receipt for sale ${saleId}`, e);
    }
  }
}
