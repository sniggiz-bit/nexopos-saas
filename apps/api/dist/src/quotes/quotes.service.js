"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
let QuotesService = class QuotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createQuoteDto) {
        const { items, ...quoteData } = createQuoteDto;
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
    async findAll(tenantId) {
        return this.prisma.quote.findMany({
            where: { tenantId },
            include: {
                customer: true,
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Quote with ID ${id} not found`);
        }
        return quote;
    }
    async update(id, updateQuoteDto) {
        const { items, ...quoteData } = updateQuoteDto;
        return this.prisma.quote.update({
            where: { id },
            data: {
                ...quoteData,
            },
        });
    }
    async remove(id) {
        return this.prisma.quote.delete({
            where: { id },
        });
    }
    async generatePdf(id) {
        const quote = await this.findOne(id);
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const data = Buffer.concat(buffers);
                resolve(data);
            });
            doc.fontSize(20).text('COTIZACIÓN', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Fecha: ${quote.createdAt.toLocaleDateString()}`, { align: 'right' });
            doc.text(`Cotización #: ${quote.id.split('-')[0]}`, { align: 'right' });
            doc.moveDown();
            doc.text('Cliente:', { underline: true });
            if (quote.customer) {
                doc.text(`Nombre: ${quote.customer.name}`);
                doc.text(`RUT: ${quote.customer.rut}`);
                if (quote.customer.address)
                    doc.text(`Dirección: ${quote.customer.address}`);
                if (quote.customer.phone)
                    doc.text(`Teléfono: ${quote.customer.phone}`);
            }
            else {
                doc.text('Cliente General');
            }
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
            doc.moveDown();
            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(14).text(`TOTAL: $${quote.total}`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text('Nota: Este documento es una cotización y no representa una boleta o factura fiscal.', { align: 'center' });
            doc.end();
        });
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map