import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InternalReceiptService {
    private readonly logger = new Logger(InternalReceiptService.name);
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');

    constructor(private prisma: PrismaService) {
        // Ensure uploads directory exists
        this.ensureUploadDirectory();
    }

    /**
     * Generate an internal receipt PDF for a sale
     * @param saleId ID of the sale
     * @returns URL of the generated PDF
     */
    async generateReceipt(saleId: string): Promise<string> {
        const logFile = 'C:\\Users\\user\\receipt-debug.log';
        const log = (msg: string) => {
            const time = new Date().toISOString();
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
            this.logger.log(msg);
        };

        try {
            log(`[Internal Receipt] Starting generation for sale ${saleId}...`);

            // 1. Fetch sale with all related data
            const sale = await this.prisma.sale.findUnique({
                where: { id: saleId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    branch: true,
                    tenant: true,
                    user: true,
                },
            });

            if (!sale) {
                throw new Error(`Sale ${saleId} not found`);
            }

            // 2. Create directory structure: uploads/receipts/{tenantId}/{year}/{month}/
            const date = new Date(sale.createdAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const saleDir = path.join(this.uploadsDir, sale.tenantId, String(year), month);

            if (!fs.existsSync(saleDir)) {
                fs.mkdirSync(saleDir, { recursive: true });
            }

            // 3. Generate PDF
            const filename = `receipt-${saleId}.pdf`;
            const filepath = path.join(saleDir, filename);
            const doc = new PDFDocument({ size: 'A4', margin: 50 });

            // Create write stream
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20)
                .text(sale.tenant.name, { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(10)
                .text('TICKET INTERNO - NO VÁLIDO COMO FACTURA', { align: 'center' })
                .moveDown(1);

            // Sale info
            doc.fontSize(12)
                .text(`Ticket N°: ${sale.id.substring(0, 8).toUpperCase()}`, { align: 'left' })
                .text(`Fecha: ${this.formatDate(sale.createdAt)}`, { align: 'left' })
                .text(`Sucursal: ${sale.branch.name}`, { align: 'left' });

            if (sale.user) {
                doc.text(`Vendedor: ${sale.user.name || sale.user.email}`, { align: 'left' });
            }

            doc.moveDown(1);

            // Line separator
            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke()
                .moveDown(0.5);

            // Table header
            doc.fontSize(10)
                .text('Cant.', 50, doc.y, { width: 50, continued: true })
                .text('Producto', 100, doc.y, { width: 250, continued: true })
                .text('P. Unit.', 350, doc.y, { width: 80, align: 'right', continued: true })
                .text('Subtotal', 430, doc.y, { width: 120, align: 'right' });

            doc.moveDown(0.5);

            // Items
            for (const item of sale.items) {
                const quantity = Number(item.quantity);
                const price = item.price;
                const subtotal = quantity * price;

                doc.fontSize(9)
                    .text(quantity.toString(), 50, doc.y, { width: 50, continued: true })
                    .text(item.product.name, 100, doc.y, { width: 250, continued: true })
                    .text(this.formatCurrency(price), 350, doc.y, { width: 80, align: 'right', continued: true })
                    .text(this.formatCurrency(subtotal), 430, doc.y, { width: 120, align: 'right' });

                doc.moveDown(0.3);
            }

            doc.moveDown(0.5);

            // Line separator
            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke()
                .moveDown(0.5);

            // Total
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('TOTAL:', 350, doc.y, { width: 80, align: 'right', continued: true })
                .text(this.formatCurrency(sale.total), 430, doc.y, { width: 120, align: 'right' });

            doc.font('Helvetica');
            doc.moveDown(1);

            // Payment method
            doc.fontSize(10)
                .text(`Método de Pago: ${this.getPaymentMethodLabel(sale.paymentMethod)}`, { align: 'left' });

            doc.moveDown(2);

            // Footer
            doc.fontSize(9)
                .text('¡Gracias por su compra!', { align: 'center' })
                .moveDown(0.5)
                .fontSize(8)
                .text('Este documento es solo para control interno', { align: 'center' })
                .text('No válido como comprobante tributario', { align: 'center' });

            // Finalize PDF
            doc.end();

            // Wait for stream to finish
            await new Promise<void>((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', (err) => reject(err));
            });

            // 4. Generate URL
            const receiptUrl = `/api/receipts/${saleId}`;

            // 5. Update sale with receipt URL
            log(`[Internal Receipt] Updating sale ${saleId} with internalReceiptUrl: ${receiptUrl}`);
            await (this.prisma.sale as any).update({
                where: { id: saleId },
                data: { internalReceiptUrl: receiptUrl },
            });

            log(`[Internal Receipt] ✅ Sale updated successfully`);
            return receiptUrl;

        } catch (error: any) {
            log(`[Internal Receipt] ❌ Error generating receipt for sale ${saleId}: ${error.message}\n${error.stack}`);
            throw error;
        }
    }

    /**
     * Get the file path for a receipt
     */
    getReceiptPath(saleId: string): string | null {
        // Find the receipt file by searching in the uploads directory
        const findReceipt = (dir: string): string | null => {
            if (!fs.existsSync(dir)) return null;

            const files = fs.readdirSync(dir, { withFileTypes: true });

            for (const file of files) {
                const fullPath = path.join(dir, file.name);

                if (file.isDirectory()) {
                    const found = findReceipt(fullPath);
                    if (found) return found;
                } else if (file.name === `receipt-${saleId}.pdf`) {
                    return fullPath;
                }
            }

            return null;
        };

        return findReceipt(this.uploadsDir);
    }

    /**
     * Format currency in Chilean pesos
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    }

    /**
     * Format date in Chilean format
     */
    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    }

    /**
     * Get payment method label in Spanish
     */
    private getPaymentMethodLabel(method: string): string {
        const labels: Record<string, string> = {
            CASH: 'Efectivo',
            CARD: 'Tarjeta',
            TRANSFER: 'Transferencia',
            DEBIT: 'Débito',
        };
        return labels[method] || method;
    }

    /**
     * Ensure upload directory exists
     */
    private ensureUploadDirectory(): void {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            this.logger.log(`[Internal Receipt] Created uploads directory: ${this.uploadsDir}`);
        }
    }
}
