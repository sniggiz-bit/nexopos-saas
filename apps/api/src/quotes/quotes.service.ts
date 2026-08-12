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
import { EmailService } from '../email/email.service';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
    private readonly emailService: EmailService,
  ) { }

  private calculateTotals(items: any[], includeIva: boolean = true) {
    const grossTotal = items.reduce((sum, item) => {
      return sum + item.price * item.quantity - (item.discount || 0);
    }, 0);

    if (includeIva) {
      // Prices are IVA-inclusive (Chilean standard). Back-calculate neto and IVA.
      const subtotal = Math.round(grossTotal / 1.19);
      const tax = grossTotal - subtotal;
      return { subtotal, tax, total: grossTotal };
    } else {
      // Prices are neto (no IVA). total = subtotal, tax = 0.
      return { subtotal: Math.round(grossTotal), tax: 0, total: Math.round(grossTotal) };
    }
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
    const { items, issueDate, validUntil, includeIva = true, ...quoteData } = createQuoteDto;
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

    const { subtotal, tax, total } = this.calculateTotals(items, includeIva);
    const number = await this.generateQuoteNumber(tenantId);

    return this.prisma.quote.create({
      data: {
        ...quoteData,
        number,
        subtotal,
        tax,
        total,
        includeIva,
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

  async sendQuoteEmail(id: string, email: string, personalMessage?: string): Promise<void> {
    const quote = await this.findOne(id);
    const pdfBuffer = await this.generatePdf(id);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: quote.tenantId },
    });

    await this.emailService.sendQuoteEmail(
      email,
      quote.number || '',
      pdfBuffer,
      personalMessage,
      tenant?.name || 'NexoPOS',
      quote,
    );

    // Update status to SENT if it was DRAFT
    if (quote.status === QuoteStatus.DRAFT) {
      await this.prisma.quote.update({
        where: { id },
        data: { status: QuoteStatus.SENT },
      });
    }
  }

  async generatePdf(id: string): Promise<Buffer> {
    const quote = (await this.findOne(id)) as any;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: quote.tenantId },
    });

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const data = Buffer.concat(buffers);
        resolve(data);
      });

      // Accent color definitions
      const primaryColor = '#0099CC';
      const textColor = '#1F2937';
      const lightGray = '#F9FAFB';
      const borderGray = '#E5E7EB';

      // Header Brand bar
      doc.rect(50, 45, 495, 4).fill(primaryColor);

      // Business details (Top Left)
      const companyName = tenant?.name || 'NexoPOS';
      doc.fillColor(textColor);
      doc.fontSize(14).font('Helvetica-Bold').text(companyName.toUpperCase(), 50, 60, { width: 290 });
      
      let headerY = 78;
      doc.fontSize(8.5).font('Helvetica').fillColor('#6B7280');
      if (tenant?.rut) {
        doc.text(`RUT: ${tenant.rut}`, 50, headerY, { width: 290 });
        headerY += 12;
      }
      if (tenant?.address) {
        doc.text(`Dirección: ${tenant.address}`, 50, headerY, { width: 290 });
        headerY += 12;
      }
      if (tenant?.phone) {
        doc.text(`Teléfono: ${tenant.phone}`, 50, headerY, { width: 290 });
        headerY += 12;
      }
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('COTIZACIÓN', 50, headerY + 2);

      // Customer Info Box
      const customerBoxTop = Math.max(headerY + 20, 130);
      doc.rect(50, customerBoxTop, 495, 75).fill(lightGray);
      doc.rect(50, customerBoxTop, 495, 75).lineWidth(1).stroke(borderGray);

      doc.fillColor('#6B7280').fontSize(8).font('Helvetica-Bold').text('COTIZADO PARA:', 65, customerBoxTop + 10);
      
      doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(quote.customer?.name || 'Cliente Casual', 65, customerBoxTop + 23);
      
      doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
      if (quote.customer?.rut) {
        doc.text(`RUT: ${quote.customer.rut}`, 65, customerBoxTop + 40);
      }
      if (quote.customer?.address) {
        doc.text(`Dirección: ${quote.customer.address}`, 65, customerBoxTop + 55);
      }
      
      if (quote.customer?.phone || quote.customer?.email) {
        let contact = '';
        if (quote.customer?.phone) contact += `Tel: ${quote.customer.phone}`;
        if (quote.customer?.email) contact += `${contact ? '  |  ' : ''}Email: ${quote.customer.email}`;
        doc.text(contact, 280, customerBoxTop + 40);
      }

      // Items Table
      const tableTop = 230;
      
      // Draw Table Header Background
      doc.rect(50, tableTop, 495, 22).fill(primaryColor);
      
      // Table Header Text
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
      doc.text('Descripción del Producto', 60, tableTop + 7, { width: 180, align: 'left' });
      doc.text('Precio Unit.', 245, tableTop + 7, { width: 70, align: 'right' });
      doc.text('Cant.', 320, tableTop + 7, { width: 40, align: 'center' });
      doc.text('Descuento', 365, tableTop + 7, { width: 70, align: 'right' });
      doc.text('Total', 440, tableTop + 7, { width: 95, align: 'right' });

      let y = tableTop + 22;
      doc.font('Helvetica').fontSize(9);

      quote.items.forEach((item, index) => {
        // Alternating row background
        if (index % 2 === 0) {
          doc.rect(50, y, 495, 22).fill('#FFFFFF');
        } else {
          doc.rect(50, y, 495, 22).fill(lightGray);
        }
        
        // Bottom row border
        doc.rect(50, y, 495, 22).lineWidth(0.5).stroke(borderGray);

        doc.fillColor(textColor);
        const name = (item.productName || item.product?.name || 'Producto').substring(0, 38);
        const discountVal = Number(item.discount) || 0;
        doc.text(name, 60, y + 7, { width: 180, align: 'left' });
        doc.text(`$${item.price.toLocaleString('es-CL')}`, 245, y + 7, { width: 70, align: 'right' });
        doc.text(Number(item.quantity).toString(), 320, y + 7, { width: 40, align: 'center' });
        
        if (discountVal > 0) {
          doc.fillColor('#10B981').text(`-$${discountVal.toLocaleString('es-CL')}`, 365, y + 7, { width: 70, align: 'right' });
          doc.fillColor(textColor);
        } else {
          doc.fillColor('#9CA3AF').text('—', 365, y + 7, { width: 70, align: 'right' });
          doc.fillColor(textColor);
        }

        doc.font('Helvetica-Bold').text(`$${item.total.toLocaleString('es-CL')}`, 440, y + 7, { width: 95, align: 'right' });
        doc.font('Helvetica');

        y += 22;
      });

      // Totals section (right side alignment)
      y += 15;
      
      const totalDiscount = quote.items.reduce((sum: number, item: any) => sum + (item.discount || 0), 0);
      const boxHeight = totalDiscount > 0 ? 80 : 65;

      // Draw a clean box for totals
      doc.rect(320, y, 225, boxHeight).fill(lightGray);
      doc.rect(320, y, 225, boxHeight).lineWidth(1).stroke(borderGray);

      let currentY = y + 10;
      doc.fillColor('#6B7280').fontSize(9);
      doc.text('Subtotal (neto):', 335, currentY, { width: 100, align: 'left' });
      doc.fillColor(textColor).text(`$${quote.subtotal.toLocaleString('es-CL')}`, 445, currentY, { width: 85, align: 'right' });

      currentY += 15;
      doc.fillColor('#6B7280').text('IVA (19%):', 335, currentY, { width: 100, align: 'left' });
      doc.fillColor(textColor).text(`$${quote.tax.toLocaleString('es-CL')}`, 445, currentY, { width: 85, align: 'right' });

      if (totalDiscount > 0) {
        currentY += 15;
        doc.fillColor('#10B981').text('Descuento:', 335, currentY, { width: 100, align: 'left' });
        doc.text(`-$${totalDiscount.toLocaleString('es-CL')}`, 445, currentY, { width: 85, align: 'right' });
      }

      currentY += 17;
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(11);
      doc.text('TOTAL:', 335, currentY, { width: 100, align: 'left' });
      doc.fillColor(primaryColor).text(`$${quote.total.toLocaleString('es-CL')}`, 445, currentY, { width: 85, align: 'right' });
      doc.font('Helvetica').fontSize(9);

      // Notes
      if (quote.notes) {
        y += 85;
        doc.fillColor('#6B7280').font('Helvetica-Bold').fontSize(8).text('NOTAS Y CONDICIONES:', 50, y);
        doc.fillColor(textColor).font('Helvetica').fontSize(9).text(quote.notes, 50, y + 12, { width: 495 });
      }

      // PDF Footer notice
      doc.fillColor('#9CA3AF').fontSize(8).text('Esta cotización es solo informativa y no constituye un comprobante de venta o documento fiscal.', 50, 740, { width: 495, align: 'center' });
      doc.text('Generado por nexopos.cl', 50, 752, { width: 495, align: 'center' });

      doc.end();
    });
  }
}
