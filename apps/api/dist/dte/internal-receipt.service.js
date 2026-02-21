"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InternalReceiptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalReceiptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PDFDocument = require('pdfkit');
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let InternalReceiptService = InternalReceiptService_1 = class InternalReceiptService {
    prisma;
    logger = new common_1.Logger(InternalReceiptService_1.name);
    uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
    constructor(prisma) {
        this.prisma = prisma;
        this.ensureUploadDirectory();
    }
    async generateReceipt(saleId) {
        const logFile = 'C:\\Users\\user\\receipt-debug.log';
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
            this.logger.log(msg);
        };
        try {
            log(`[Internal Receipt] Starting generation for sale ${saleId}...`);
            const sale = await this.prisma.sale.findUnique({
                where: { id: saleId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                    branch: true,
                    tenant: true,
                    user: true,
                },
            });
            if (!sale) {
                throw new Error(`Sale ${saleId} not found`);
            }
            const date = new Date(sale.createdAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const saleDir = path.join(this.uploadsDir, sale.tenantId, String(year), month);
            if (!fs.existsSync(saleDir)) {
                fs.mkdirSync(saleDir, { recursive: true });
            }
            const filename = `receipt-${saleId}.pdf`;
            const filepath = path.join(saleDir, filename);
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            doc.fontSize(18)
                .font('Helvetica-Bold')
                .text(sale.tenant.name, { align: 'center' })
                .moveDown(0.2);
            doc.fontSize(10)
                .font('Helvetica')
                .text(`RUT: ${sale.tenant.rut || 'N/A'}`, { align: 'center' })
                .text(`Giro: ${sale.tenant.giro || 'N/A'}`, { align: 'center' })
                .text(`Dirección: ${sale.tenant.address || 'N/A'}`, { align: 'center' })
                .moveDown(0.5);
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('TICKET INTERNO - CONTROL DE VENTA', { align: 'center' })
                .moveDown(1);
            doc.fontSize(10)
                .font('Helvetica')
                .text(`Ticket ID: ${sale.id.substring(0, 8).toUpperCase()}`, { align: 'left' })
                .text(`Fecha: ${this.formatDate(sale.createdAt)}`, { align: 'left' })
                .text(`Sucursal: ${sale.branch.name}`, { align: 'left' })
                .text(`Turno Caja: ${sale.cashShiftId ? sale.cashShiftId.substring(0, 8).toUpperCase() : 'N/A'}`, { align: 'left' });
            if (sale.user) {
                doc.text(`Vendedor: ${sale.user.name || sale.user.email}`, { align: 'left' });
            }
            doc.moveDown(0.5);
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('Cant.', 50, doc.y, { width: 50, continued: true })
                .text('Producto', 100, doc.y, { width: 250, continued: true })
                .text('P. Unit.', 350, doc.y, { width: 80, align: 'right', continued: true })
                .text('Subtotal', 430, doc.y, { width: 120, align: 'right' });
            doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(9);
            for (const item of sale.items) {
                const quantity = Number(item.quantity);
                const price = item.price;
                const subtotal = quantity * price;
                doc.text(quantity.toString(), 50, doc.y, { width: 50, continued: true })
                    .text(item.product.name, 100, doc.y, { width: 250, continued: true })
                    .text(this.formatCurrency(price), 350, doc.y, { width: 80, align: 'right', continued: true })
                    .text(this.formatCurrency(subtotal), 430, doc.y, { width: 120, align: 'right' });
                doc.moveDown(0.3);
            }
            doc.moveDown(0.5);
            doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
            const total = sale.total;
            const factorIVA = 1.19;
            const neto = Math.round(total / factorIVA);
            const iva = total - neto;
            doc.fontSize(10)
                .text('Neto:', 350, doc.y, { width: 80, align: 'right', continued: true })
                .text(this.formatCurrency(neto), 430, doc.y, { width: 120, align: 'right' })
                .moveDown(0.2);
            doc.text('IVA (19%):', 350, doc.y, { width: 80, align: 'right', continued: true })
                .text(this.formatCurrency(iva), 430, doc.y, { width: 120, align: 'right' })
                .moveDown(0.5);
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('TOTAL:', 350, doc.y, { width: 80, align: 'right', continued: true })
                .text(this.formatCurrency(total), 430, doc.y, { width: 120, align: 'right' });
            doc.font('Helvetica').moveDown(1);
            doc.fontSize(10).font('Helvetica-Bold').text('Pagos:', { align: 'left' }).font('Helvetica');
            for (const payment of sale.payments) {
                doc.text(`- ${this.getPaymentMethodLabel(payment.paymentMethod)}: ${this.formatCurrency(payment.amount)}`, { align: 'left' });
            }
            doc.moveDown(2);
            doc.fontSize(9)
                .text('¡Gracias por su compra!', { align: 'center' })
                .moveDown(0.5)
                .fontSize(8)
                .text('Vendido con NexoPOS - Trazabilidad Turno: ' + (sale.cashShiftId || 'N/A'), { align: 'center' });
            doc.end();
            await new Promise((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', (err) => reject(err));
            });
            const receiptUrl = `/api/receipts/${saleId}`;
            log(`[Internal Receipt] Updating sale ${saleId} with internalReceiptUrl: ${receiptUrl}`);
            await this.prisma.sale.update({
                where: { id: saleId },
                data: { internalReceiptUrl: receiptUrl },
            });
            log(`[Internal Receipt] ✅ Sale updated successfully`);
            return receiptUrl;
        }
        catch (error) {
            log(`[Internal Receipt] ❌ Error generating receipt for sale ${saleId}: ${error.message}\n${error.stack}`);
            throw error;
        }
    }
    getReceiptPath(saleId) {
        const findReceipt = (dir) => {
            if (!fs.existsSync(dir))
                return null;
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    const found = findReceipt(fullPath);
                    if (found)
                        return found;
                }
                else if (file.name === `receipt-${saleId}.pdf`) {
                    return fullPath;
                }
            }
            return null;
        };
        return findReceipt(this.uploadsDir);
    }
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    }
    formatDate(date) {
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    }
    getPaymentMethodLabel(method) {
        const labels = {
            EFECTIVO: 'Efectivo',
            DEBITO: 'Débito',
            CREDITO: 'Crédito',
            TRANSFERENCIA: 'Transferencia',
        };
        return labels[method] || method;
    }
    ensureUploadDirectory() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            this.logger.log(`[Internal Receipt] Created uploads directory: ${this.uploadsDir}`);
        }
    }
};
exports.InternalReceiptService = InternalReceiptService;
exports.InternalReceiptService = InternalReceiptService = InternalReceiptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InternalReceiptService);
//# sourceMappingURL=internal-receipt.service.js.map