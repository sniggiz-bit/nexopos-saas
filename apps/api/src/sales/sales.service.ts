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
import { EventsService } from '../events/events.service';
import { MovementType, Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import * as fs from 'fs';

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
    private eventsService: EventsService,
    private emailService: EmailService,
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
      dteType,
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
      // 1.1. Validate customer if provided
      if (customerId) {
        const customer = await prisma.customer.findFirst({
          where: { id: customerId, tenantId },
        });
        if (!customer) {
          throw new BadRequestException('El cliente especificado no pertenece a este inquilino');
        }
      }

      // 1.2. Validate quote if provided
      if (quoteId) {
        const quote = await prisma.quote.findFirst({
          where: { id: quoteId, tenantId },
        });
        if (!quote) {
          throw new BadRequestException('La cotización especificada no pertenece a este inquilino');
        }
      }

      // 1.3. Validate products
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
          dteType: dteType ?? 39,
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

      // 7. Mark quote as ACCEPTED (Vendida) if quoteId provided
      if (quoteId) {
        await prisma.quote.update({
          where: { id: quoteId },
          data: { status: 'ACCEPTED' },
        });
      }

      // 8. Update Movement References (Async or inside transaction if vital)
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

    // Notify all connected clients for this tenant so their UI refetches stock
    this.eventsService.emit({
      type: 'sale.created',
      tenantId,
      branchId,
      payload: { saleId: sale.id },
    });

    // Post-Sale Actions (DTE, etc)
    if (sale.status === 'COMPLETED') {
      await this.emitDteAndReceipt(sale.id);
      return this.prisma.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
        },
      });
    }

    return sale;
  }

  async completePreSale(id: string, tenantId: string, payments: CreatePaymentDto[]) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
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
    await this.emitDteAndReceipt(id);

    return this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, payments: true, customer: true, credit: true },
    });
  }

  async emitirNotaCreditoForSale(saleId: string, tenantId: string) {
    const note = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRawUnsafe('SELECT "id" FROM "Sale" WHERE "id"=$1 FOR UPDATE', saleId);
      const original = await tx.sale.findFirst({ where: { id: saleId, tenantId }, include: { items: true, credit: true } });
      if (!original) throw new NotFoundException('Venta no encontrada.');
      const existing = await tx.sale.findFirst({ where: { originalSaleId: saleId, tenantId, dteType: 61 } });
      if (existing) return existing;
      if (original.status !== 'COMPLETED' || !original.dteVerifiedAt || !original.dteProviderId || !original.dteFolio || !['ACEPTADO', 'REPARO'].includes(original.dteStatus)) throw new BadRequestException('Se requiere una venta completada y un documento original confirmado antes de emitir la nota de crédito.');
      if (original.credit) throw new BadRequestException('La venta tiene un crédito asociado. Revisa su conciliación antes de emitir una anulación completa.');
      return tx.sale.create({ data: {
        total: original.total, discountAmount: original.discountAmount, tenantId, branchId: original.branchId, userId: original.userId,
        customerId: original.customerId, status: 'PENDING_CREDIT_NOTE', dteType: 61, originalSaleId: saleId,
        items: { create: original.items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price, discountAmount: item.discountAmount })) },
      } });
    });
    const result = await this.dteService.emitirDte(note.id);
    if (result.status === 'ACEPTADO') await this.applyCreditNote(note.id, tenantId);
    return result;
  }
  async verifyDte(saleId: string, tenantId: string) {
    const result = await this.dteService.verify(saleId, tenantId);
    if (result.status === 'ACEPTADO') await this.applyCreditNote(saleId, tenantId);
    return result;
  }
  dtePdf(saleId: string, user: { tenantId: string; role?: string; branchId?: string }) { return this.dteService.pdf(saleId, user); }
  private async applyCreditNote(noteId: string, tenantId: string) {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const note = await tx.sale.findFirst({ where: { id: noteId, tenantId, dteType: 61, dteStatus: 'ACEPTADO', dteVerifiedAt: { not: null } } });
      if (!note?.originalSaleId) return;
      await tx.$queryRawUnsafe('SELECT "id" FROM "Sale" WHERE "id"=$1 FOR UPDATE', note.originalSaleId);
      const original = await tx.sale.findFirst({ where: { id: note.originalSaleId, tenantId }, include: { items: true } });
      if (!original) throw new NotFoundException('Venta original no encontrada.');
      if (original.status === 'CANCELLED') return;
      if (original.status !== 'COMPLETED') throw new BadRequestException('La venta original requiere revisión antes de aplicar la anulación.');
      for (const item of original.items) await this.inventoryService.logMovement({ productId: item.productId, branchId: original.branchId, quantity: Number(item.quantity), type: MovementType.RETURN, reference: 'Nota de crédito confirmada ' + note.dteFolio, userId: original.userId || undefined }, tx);
      await tx.sale.update({ where: { id: original.id }, data: { status: 'CANCELLED' } });
      await tx.sale.update({ where: { id: note.id }, data: { status: 'CREDIT_NOTE' } });
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

  async sendSaleReceiptEmail(saleId: string, email: string): Promise<void> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${saleId} no encontrada`);
    }

    let pdfBuffer: Buffer | null = null;
    let filename = `comprobante-${saleId}.pdf`;
    const verified = !!sale.dteVerifiedAt && !!sale.dteProviderId && !!sale.dteFolio;
    let docTypeLabel = 'Comprobante interno';

    if (verified && sale.dteType === 39) docTypeLabel = 'Boleta';
    else if (verified && sale.dteType === 33) docTypeLabel = 'Factura';
    else if (verified && sale.dteType === 52) docTypeLabel = 'Guía de Despacho';

    const folio = verified ? String(sale.dteFolio) : sale.id.substring(0, 8).toUpperCase();
    filename = `${docTypeLabel.toLowerCase().replace(/ /g, '_')}-${folio}.pdf`;

    // 1. Try DTE PDF if present
    if (sale.dteVerifiedAt && sale.dteProviderId && sale.dtePdfUrl?.startsWith('/api/sales/')) {
      pdfBuffer = await this.dteService.pdf(sale.id, { tenantId: sale.tenantId });
    }

    // 2. Fallback to Internal Receipt PDF
    if (!pdfBuffer) {
      let filepath = this.internalReceiptService.getReceiptPath(saleId);
      if (!filepath || !fs.existsSync(filepath)) {
        // Generate dynamically if missing
        try {
          await this.internalReceiptService.generateReceipt(saleId);
          filepath = this.internalReceiptService.getReceiptPath(saleId);
        } catch (e) {
          this.logger.error(`Failed to generate receipt during email dispatch fallback for sale ${saleId}`, e);
        }
      }

      if (filepath && fs.existsSync(filepath)) {
        pdfBuffer = fs.readFileSync(filepath);
      } else {
        throw new BadRequestException('No se pudo encontrar ni generar el comprobante PDF para esta venta.');
      }
    }

    await this.emailService.sendSaleReceiptEmail(
      email,
      docTypeLabel,
      folio,
      pdfBuffer!,
      filename,
    );
  }

  async cancelInternalSale(saleId: string, tenantId: string, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, dteSubmission: true },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.tenantId !== tenantId) {
      throw new BadRequestException('La venta no pertenece a este inquilino');
    }

    if (sale.dteSubmission || ['ERROR', 'ENVIANDO', 'PENDIENTE_CONFIRMACION', 'REQUIERE_REVISION'].includes(sale.dteStatus)) throw new BadRequestException('El envío tributario requiere conciliación antes de anular la venta. No se devolverá inventario.');
    if (sale.dteFolio) {
      throw new BadRequestException(
        'No se puede eliminar una venta con folio DTE asignado. Utilice Nota de Crédito.',
      );
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Esta venta ya se encuentra anulada.');
    }

    await this.prisma.$transaction(async (prisma) => {
      // 1. Marcar venta como ANULADA (CANCELLED)
      await prisma.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' },
      });

      // 2. Devolver productos al inventario
      for (const item of sale.items) {
        await this.inventoryService.logMovement(
          {
            productId: item.productId,
            branchId: sale.branchId,
            quantity: Number(item.quantity), // Positivo = Ingreso
            type: MovementType.RETURN,
            reference: `Anulación venta de control interno ${saleId.substring(0, 8).toUpperCase()}`,
            userId: userId,
          },
          prisma,
        );
      }
    });

    return { success: true };
  }
}

