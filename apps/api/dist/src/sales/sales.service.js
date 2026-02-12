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
let SalesService = SalesService_1 = class SalesService {
    prisma;
    dteService;
    internalReceiptService;
    logger = new common_1.Logger(SalesService_1.name);
    constructor(prisma, dteService, internalReceiptService) {
        this.prisma = prisma;
        this.dteService = dteService;
        this.internalReceiptService = internalReceiptService;
    }
    async getSales(filters = {}) {
        const { startDate, endDate, branchId } = filters;
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        if (branchId) {
            where.branchId = branchId;
        }
        return this.prisma.sale.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                branch: true,
                user: true,
            },
        });
    }
    async createSale(createSaleDto) {
        const logFile = 'C:\\Users\\user\\sales-debug.log';
        const log = (msg) => {
            const time = new Date().toISOString();
            const fs = require('fs');
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
            this.logger.log(msg);
        };
        log(`[Sales Service] Starting creation of sale for tenant ${createSaleDto.tenantId}`);
        log(`- Items count: ${createSaleDto.items.length}`);
        log(`- Payments count: ${createSaleDto.payments.length}`);
        const { tenantId, branchId, userId, items, payments } = createSaleDto;
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Sale must contain at least one item');
        }
        if (!payments || payments.length === 0) {
            throw new common_1.BadRequestException('Sale must contain at least one payment method');
        }
        const sale = await this.prisma.$transaction(async (prisma) => {
            const productIds = items.map(item => item.productId);
            const products = await prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    tenantId,
                },
            });
            if (products.length !== productIds.length) {
                const foundIds = products.map(p => p.id);
                const missingIds = productIds.filter(id => !foundIds.includes(id));
                throw new common_1.BadRequestException(`Products not found or don't belong to tenant: ${missingIds.join(', ')}`);
            }
            let currentShift = await prisma.cashShift.findFirst({
                where: {
                    branchId,
                    status: 'OPEN',
                },
            });
            if (!currentShift) {
                throw new common_1.BadRequestException('No hay turno de caja abierto. Debe abrir caja para realizar ventas.');
            }
            const productPriceMap = new Map(products.map(p => [p.id, p.price]));
            for (const item of items) {
                const inventory = await prisma.inventoryLevel.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId,
                        },
                    },
                });
                if (!inventory) {
                    throw new common_1.BadRequestException(`Product ${item.productId} not found in branch inventory`);
                }
                if (inventory.quantity < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId}. Available: ${inventory.quantity}, Requested: ${item.quantity}`);
                }
            }
            for (const item of items) {
                await prisma.inventoryLevel.update({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId,
                        },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });
            }
            const total = items.reduce((acc, item) => {
                const priceFromDB = Number(productPriceMap.get(item.productId) || 0);
                return acc + (priceFromDB * Number(item.quantity));
            }, 0);
            const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
            if (Math.abs(totalPaid - total) > 0.01) {
                throw new common_1.BadRequestException(`El total pagado ($${totalPaid}) no coincide con el total de la venta ($${total}).`);
            }
            const sale = await prisma.sale.create({
                data: {
                    tenantId,
                    branchId,
                    userId,
                    cashShiftId: currentShift.id,
                    total,
                    items: {
                        create: items.map((item) => {
                            const priceFromDB = Number(productPriceMap.get(item.productId) || 0);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price: priceFromDB,
                            };
                        }),
                    },
                    payments: {
                        create: payments.map((p) => ({
                            paymentMethod: p.paymentMethod,
                            amount: p.amount,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                    branch: true,
                    user: true,
                },
            });
            return sale;
        });
        log(`[Sales Service] Emitting DTE for sale ${sale.id}...`);
        try {
            await this.dteService.emitirDte(sale.id);
            log(`- DTE emitted successfully`);
        }
        catch (error) {
            log(`- DTE emission FAILED: ${error.message}`);
            this.logger.error(`[Sales Service] Error emitiendo DTE para venta ${sale.id}:`, error.message);
        }
        log(`[Sales Service] Requesting internal receipt for sale ${sale.id}...`);
        try {
            await this.internalReceiptService.generateReceipt(sale.id);
            log(`- Internal receipt generated successfully`);
        }
        catch (error) {
            log(`- Internal receipt generation FAILED: ${error.message}`);
            this.logger.error(`[Sales Service] Error generando ticket interno para venta ${sale.id}:`, error.message);
        }
        log(`[Sales Service] Fetching final sale object...`);
        const finalSale = await this.prisma.sale.findUnique({
            where: { id: sale.id },
            include: {
                items: { include: { product: true } },
                payments: true,
                branch: true,
                user: true,
            },
        });
        return finalSale;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dte_service_1.DteService,
        internal_receipt_service_1.InternalReceiptService])
], SalesService);
//# sourceMappingURL=sales.service.js.map