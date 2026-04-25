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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dte_service_1 = require("../dte/dte.service");
const internal_receipt_service_1 = require("../dte/internal-receipt.service");
const credits_service_1 = require("../credits/credits.service");
const inventory_service_1 = require("../inventory/inventory.service");
const client_1 = require("@prisma/client");
let SalesService = SalesService_1 = class SalesService {
    prisma;
    dteService;
    internalReceiptService;
    creditsService;
    inventoryService;
    logger = new common_1.Logger(SalesService_1.name);
    constructor(prisma, dteService, internalReceiptService, creditsService, inventoryService) {
        this.prisma = prisma;
        this.dteService = dteService;
        this.internalReceiptService = internalReceiptService;
        this.creditsService = creditsService;
        this.inventoryService = inventoryService;
    }
    async getSales(filters = {}) {
        const { startDate, endDate, branchId } = filters;
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        if (branchId)
            where.branchId = branchId;
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
    async createSale(createSaleDto) {
        this.logger.log(`Starting createSale with DTO: ${JSON.stringify(createSaleDto, null, 2)}`);
        const { tenantId, branchId, userId, items, payments, status = 'COMPLETED', customerId, quoteId, } = createSaleDto;
        if (!tenantId) {
            throw new common_1.BadRequestException('tenantId is required');
        }
        if (!branchId) {
            throw new common_1.BadRequestException('branchId is required. Ensure your user is assigned to a branch.');
        }
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Sale must contain at least one item');
        }
        if (status === 'COMPLETED') {
            if (!payments || payments.length === 0) {
                throw new common_1.BadRequestException('Sale must contain at least one payment method');
            }
        }
        const hasCreditPayment = payments?.some((p) => p.paymentMethod === 'CREDITO');
        if (hasCreditPayment && !customerId) {
            throw new common_1.BadRequestException('Customer is required for CREDIT payments');
        }
        const sale = await this.prisma.$transaction(async (prisma) => {
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
                throw new common_1.BadRequestException(`Some products were not found: ${missingIds.join(', ')}`);
            }
            const currentShift = await prisma.cashShift.findFirst({
                where: { branchId, status: 'OPEN' },
            });
            if (!currentShift) {
                throw new common_1.BadRequestException('No open shift found. Please open a shift first.');
            }
            const productMap = new Map(products.map((p) => [p.id, p]));
            for (const item of items) {
                const inventory = await prisma.inventory.findUnique({
                    where: {
                        productId_branchId: { productId: item.productId, branchId },
                    },
                });
                if (!inventory || inventory.quantity.lessThan(item.quantity)) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId}`);
                }
                await this.inventoryService.logMovement({
                    productId: item.productId,
                    branchId,
                    quantity: -Number(item.quantity),
                    type: client_1.MovementType.SALE,
                    reference: `Venta`,
                    userId,
                }, prisma);
            }
            let totalDiscount = 0;
            const total = items.reduce((acc, item) => {
                const product = productMap.get(item.productId);
                const linePrice = item.price ?? Number(product?.price || 0);
                const discount = item.discountAmount ?? 0;
                totalDiscount += discount;
                return acc + (linePrice * Number(item.quantity)) - discount;
            }, 0);
            if (status === 'COMPLETED') {
                const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
                if (Math.abs(totalPaid - total) > 0.01) {
                    throw new common_1.BadRequestException(`Paid amount ($${totalPaid}) does not match total ($${total})`);
                }
            }
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
            if (status === 'COMPLETED' && hasCreditPayment) {
                const creditAmount = payments
                    .filter((p) => p.paymentMethod === 'CREDITO')
                    .reduce((acc, p) => acc + p.amount, 0);
                await prisma.credit.create({
                    data: {
                        tenantId,
                        customerId: customerId,
                        saleId: createdSale.id,
                        totalAmount: creditAmount,
                        balance: creditAmount,
                        status: 'OPEN',
                    },
                });
            }
            await prisma.stockMovement.updateMany({
                where: {
                    reference: 'Venta',
                    productId: { in: items.map((i) => i.productId) },
                    branchId,
                    createdAt: { gte: new Date(Date.now() - 5000) },
                },
                data: { reference: `SALE-${createdSale.id}` },
            });
            return createdSale;
        });
        if (sale.status === 'COMPLETED') {
            this.emitDteAndReceipt(sale.id);
        }
        return sale;
    }
    async completePreSale(id, payments) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!sale)
            throw new common_1.NotFoundException('Sale not found');
        if (sale.status !== 'PRE_SALE')
            throw new common_1.BadRequestException('Sale is not a pre-sale');
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        if (Math.abs(totalPaid - sale.total) > 0.01) {
            throw new common_1.BadRequestException(`Paid amount ($${totalPaid}) does not match total ($${sale.total})`);
        }
        const hasCreditPayment = payments.some((p) => p.paymentMethod === 'CREDITO');
        if (hasCreditPayment && !sale.customerId) {
            throw new common_1.BadRequestException('Customer is required for CREDIT payments');
        }
        await this.prisma.$transaction(async (prisma) => {
            await prisma.payment.createMany({
                data: payments.map((p) => ({
                    saleId: id,
                    amount: p.amount,
                    paymentMethod: p.paymentMethod,
                })),
            });
            await prisma.sale.update({
                where: { id },
                data: { status: 'COMPLETED' },
            });
            if (hasCreditPayment) {
                const creditAmount = payments
                    .filter((p) => p.paymentMethod === 'CREDITO')
                    .reduce((acc, p) => acc + p.amount, 0);
                await prisma.credit.create({
                    data: {
                        tenantId: sale.tenantId,
                        customerId: sale.customerId,
                        saleId: sale.id,
                        totalAmount: creditAmount,
                        balance: creditAmount,
                        status: 'OPEN',
                    },
                });
            }
        });
        this.emitDteAndReceipt(id);
        return this.prisma.sale.findUnique({
            where: { id },
            include: { items: true, payments: true, customer: true, credit: true },
        });
    }
    async emitDteAndReceipt(saleId) {
        try {
            await this.dteService.emitirDte(saleId);
        }
        catch (e) {
            this.logger.error(`Failed to emit DTE for sale ${saleId}`, e);
        }
        try {
            await this.internalReceiptService.generateReceipt(saleId);
        }
        catch (e) {
            this.logger.error(`Failed to generate receipt for sale ${saleId}`, e);
        }
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dte_service_1.DteService,
        internal_receipt_service_1.InternalReceiptService,
        credits_service_1.CreditsService,
        inventory_service_1.InventoryService])
], SalesService);
//# sourceMappingURL=sales.service.js.map