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
const sales_service_1 = require("../sales/sales.service");
const client_1 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
let QuotesService = class QuotesService {
    prisma;
    salesService;
    constructor(prisma, salesService) {
        this.prisma = prisma;
        this.salesService = salesService;
    }
    calculateTotals(items) {
        const subtotal = items.reduce((sum, item) => {
            const itemTotal = (item.price * item.quantity) - (item.discount || 0);
            return sum + itemTotal;
        }, 0);
        const tax = subtotal * 0.19;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }
    async generateQuoteNumber(tenantId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
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
    async create(createQuoteDto) {
        const { items, ...quoteData } = createQuoteDto;
        const { subtotal, tax, total } = this.calculateTotals(items);
        const number = await this.generateQuoteNumber(createQuoteDto.tenantId);
        return this.prisma.quote.create({
            data: {
                ...quoteData,
                number,
                subtotal,
                tax,
                total,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        discount: item.discount || 0,
                        total: (item.price * item.quantity) - (item.discount || 0),
                    })),
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
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Quote with ID ${id} not found`);
        }
        return quote;
    }
    async update(id, updateQuoteDto) {
        const { items, ...quoteData } = updateQuoteDto;
        const updateData = { ...quoteData };
        if (items) {
            const { subtotal, tax, total } = this.calculateTotals(items);
            updateData.subtotal = subtotal;
            updateData.tax = tax;
            updateData.total = total;
            await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            updateData.items = {
                create: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount || 0,
                    total: (item.price * item.quantity) - (item.discount || 0),
                })),
            };
        }
        return this.prisma.quote.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                customer: true,
            }
        });
    }
    async remove(id) {
        await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
        return this.prisma.quote.delete({
            where: { id },
        });
    }
    async convertToSale(id) {
        const quote = await this.findOne(id);
        if (quote.status === client_1.QuoteStatus.ACCEPTED) {
            throw new common_1.BadRequestException('This quote has already been accepted and converted to a sale.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: quote.userId || '' },
        });
        let branchId = user?.branchId;
        if (!branchId) {
            const branch = await this.prisma.branch.findFirst({
                where: { tenantId: quote.tenantId, isMain: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('No branch found to associate the sale.');
            branchId = branch.id;
        }
        const sale = await this.salesService.createSale({
            tenantId: quote.tenantId,
            branchId: branchId,
            userId: user?.id,
            customerId: quote.customerId ?? undefined,
            quoteId: quote.id,
            status: 'PRE_SALE',
            items: quote.items.map(item => ({
                productId: item.productId,
                quantity: Number(item.quantity),
            })),
            payments: [],
        });
        await this.prisma.quote.update({
            where: { id },
            data: { status: client_1.QuoteStatus.ACCEPTED },
        });
        return sale;
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
            doc.fontSize(12).text(`Fecha: ${quote.issueDate.toLocaleDateString()}`, { align: 'right' });
            doc.text(`Cotización #: ${quote.number}`, { align: 'right' });
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
                doc.text((item.productName || item.product.name).substring(0, 35), 50, y);
                doc.text(item.quantity.toString(), 280, y);
                doc.text(`$${item.price.toLocaleString()}`, 350, y);
                doc.text(`$${item.total.toLocaleString()}`, 450, y);
                y += 20;
            });
            y += 20;
            doc.fontSize(10);
            doc.text(`Subtotal: $${quote.subtotal.toLocaleString()}`, 350, y);
            y += 15;
            doc.text(`IVA (19%): $${quote.tax.toLocaleString()}`, 350, y);
            y += 20;
            doc.font('Helvetica-Bold').fontSize(14).text(`TOTAL: $${quote.total.toLocaleString()}`, 350, y);
            if (quote.notes) {
                doc.moveDown();
                doc.fontSize(10).font('Helvetica-Bold').text('Notas:');
                doc.font('Helvetica').text(quote.notes);
            }
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text('Nota: Este documento es una cotización y no representa una boleta o factura fiscal.', { align: 'center' });
            doc.end();
        });
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sales_service_1.SalesService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map