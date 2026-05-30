import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SalesService } from '../sales/sales.service';
import { QuoteStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
  ) { }

  private calculateTotals(items: any[]) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity - (item.discount || 0);
      return sum + itemTotal;
    }, 0);
    const tax = subtotal * 0.19; // 19% IVA
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  private async generateQuoteNumber(tenantId: string) {
    const lastQuote = await this.prisma.quote.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastQuote && lastQuote.number) {
      const match = lastQuote.number.match(/QT-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `QT-${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(createQuoteDto: CreateQuoteDto) {
    const { items, issueDate, validUntil, ...quoteData } = createQuoteDto;
    const tenantId = createQuoteDto.tenantId;

    if (quoteData.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: quoteData.customerId, tenantId },
      });
      if (!customer) {
        throw new BadRequestException('El cliente especificado no pertenece a este inquilino');
      }
    }

    if (items && items.length > 0) {
      const productIds = items.map((i) => i.productId);
      const dbProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });
      if (dbProducts.length !== productIds.length) {
        throw new BadRequestException('Algunos productos no existen o no pertenecen al inquilino');
      }
    }

    const { subtotal, tax, total } = this.calculateTotals(items);
    const number = await this.generateQuoteNumber(tenantId);

    return this.prisma.quote.create({
      data: {
        ...quoteData,
        number,
        subtotal,
        tax,
        total,
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.price * item.quantity - (item.discount || 0),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.quote.findMany({
      where: { tenantId },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto) {
    const { items, ...quoteData } = updateQuoteDto;

    const existingQuote = await this.prisma.quote.findUnique({
      where: { id },
    });
    if (!existingQuote) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }
    const tenantId = existingQuote.tenantId;

    if (quoteData.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: quoteData.customerId, tenantId },
      });
      if (!customer) {
        throw new BadRequestException('El cliente especificado no pertenece a este inquilino');
      }
    }

    if (items && items.length > 0) {
      const productIds = items.map((i) => i.productId);
      const dbProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });
      if (dbProducts.length !== productIds.length) {
        throw new BadRequestException('Algunos productos no existen o no pertenecen al inquilino');
      }
    }

    const updateData: any = { ...quoteData };

    if (items) {
      const { subtotal, tax, total } = this.calculateTotals(items);
      updateData.subtotal = subtotal;
      updateData.tax = tax;
      updateData.total = total;

      await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
      updateData.items = {
        create: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          total: item.price * item.quantity - (item.discount || 0),
        })),
      };
    }

    // Guard against empty update (e.g. whitelist stripped all fields)
    if (Object.keys(updateData).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        customer: true,
      },
    });
  }

  async remove(id: string) {
    // Detach related sales (quoteId is nullable) before deleting
    await this.prisma.sale.updateMany({
      where: { quoteId: id },
      data: { quoteId: null },
    });
    await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
    return this.prisma.quote.delete({ where: { id } });
  }

  async convertToSale(id: string) {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new BadRequestException(
        'Esta cotización ya fue aceptada y convertida en venta.',
      );
    }

    // Get tenant and branch info.
    // Quotes don't have branchId in the schema user provided, but Sales do.
    // I'll check the user's branchId or use a default one/tenant's main branch.
    const user = await this.prisma.user.findUnique({
      where: { id: quote.userId || '' },
    });

    let branchId = user?.branchId;

    if (!branchId) {
      // Find main branch for tenant
      const branch = await this.prisma.branch.findFirst({
        where: { tenantId: quote.tenantId, isMain: true },
      });
      if (!branch)
        throw new BadRequestException('No branch found to associate the sale.');
      branchId = branch.id;
    }

    // Create the sale
    const sale = await this.salesService.createSale({
      tenantId: quote.tenantId,
      branchId: branchId,
      userId: user?.id,
      customerId: quote.customerId ?? undefined,
      quoteId: quote.id,
      status: 'PRE_SALE',
      items: quote.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      payments: [], // Empty for pre-sale
    });

    // Update quote status
    await this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.ACCEPTED },
    });

    return sale;
  }

  async generatePdf(id: string): Promise<Buffer> {
    const quote = (await this.findOne(id)) as any;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const data = Buffer.concat(buffers);
        resolve(data);
      });

      // Header
      doc.fontSize(20).text('COTIZACIÓN', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Fecha: ${quote.issueDate.toLocaleDateString()}`, {
        align: 'right',
      });
      doc.text(`Cotización #: ${quote.number}`, { align: 'right' });

      // Customer Info
      doc.moveDown();
      doc.text('Cliente:', { underline: true });
      if (quote.customer) {
        doc.text(`Nombre: ${quote.customer.name}`);
        doc.text(`RUT: ${quote.customer.rut}`);
        if (quote.customer.address)
          doc.text(`Dirección: ${quote.customer.address}`);
        if (quote.customer.phone) doc.text(`Teléfono: ${quote.customer.phone}`);
      } else {
        doc.text('Cliente General');
      }

      // Items Table
      doc.moveDown();
      const tableTop = 250;
      doc.font('Helvetica-Bold');
      doc.text('Producto', 50, tableTop);
      doc.text('Cant.', 280, tableTop);
      doc.text('Precio', 350, tableTop);
      doc.text('Total', 450, tableTop);
      doc.font('Helvetica');

      let y = tableTop + 25;
      quote.items.forEach((item) => {
        doc.text(
          (item.productName || item.product.name).substring(0, 35),
          50,
          y,
        );
        doc.text(item.quantity.toString(), 280, y);
        doc.text(`$${item.price.toLocaleString()}`, 350, y);
        doc.text(`$${item.total.toLocaleString()}`, 450, y);
        y += 20;
      });

      // Totals
      y += 20;
      doc.fontSize(10);
      doc.text(`Subtotal: $${quote.subtotal.toLocaleString()}`, 350, y);
      y += 15;
      doc.text(`IVA (19%): $${quote.tax.toLocaleString()}`, 350, y);
      y += 20;
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(`TOTAL: $${quote.total.toLocaleString()}`, 350, y);

      if (quote.notes) {
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold').text('Notas:');
        doc.font('Helvetica').text(quote.notes);
      }

      doc.moveDown();
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          'Nota: Este documento es una cotización y no representa una boleta o factura fiscal.',
          { align: 'center' },
        );

      doc.end();
    });
  }
}
