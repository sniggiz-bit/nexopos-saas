
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import PDFDocument from 'pdfkit';

@Injectable()
export class QuotesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createQuoteDto: CreateQuoteDto) {
        const { items, ...quoteData } = createQuoteDto;

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return this.prisma.quote.create({
            data: {
                ...quoteData,
                total,
                items: {
                    create: items,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    }
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
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: {
                customer: true,
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

        // If items are being updated, we might need to recalculate total
        // For simplicity validation, if items are present, we replace them.
        // Real implementation might be more complex.

        return this.prisma.quote.update({
            where: { id },
            data: {
                ...quoteData,
            },
        });
    }

    async remove(id: string) {
        return this.prisma.quote.delete({
            where: { id },
        });
    }

    async generatePdf(id: string): Promise<Buffer> {
        const quote = await this.findOne(id);

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
            doc.fontSize(12).text(`Fecha: ${quote.createdAt.toLocaleDateString()}`, { align: 'right' });
            doc.text(`Cotización #: ${quote.id.split('-')[0]}`, { align: 'right' }); // Short ID

            // Customer Info
            doc.moveDown();
            doc.text('Cliente:', { underline: true });
            if (quote.customer) {
                doc.text(`Nombre: ${quote.customer.name}`);
                doc.text(`RUT: ${quote.customer.rut}`);
                if (quote.customer.address) doc.text(`Dirección: ${quote.customer.address}`);
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
            quote.items.forEach(item => {
                const total = Number(item.quantity) * item.price;
                doc.text(item.product.name.substring(0, 35), 50, y);
                doc.text(item.quantity.toString(), 280, y);
                doc.text(`$${item.price}`, 350, y);
                doc.text(`$${total}`, 450, y);
                y += 20;
            });

            // Total
            doc.moveDown();
            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(14).text(`TOTAL: $${quote.total}`, { align: 'right' });

            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text('Nota: Este documento es una cotización y no representa una boleta o factura fiscal.', { align: 'center' });

            doc.end();
        });
    }
}
