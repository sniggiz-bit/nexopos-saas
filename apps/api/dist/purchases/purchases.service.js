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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PurchasesService = class PurchasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, branchId) {
        return this.prisma.purchase.findMany({
            where: {
                tenantId,
                ...(branchId ? { branchId } : {}),
            },
            include: {
                supplier: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
                _count: { select: { items: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, tenantId) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: {
                supplier: { select: { id: true, name: true, rut: true } },
                branch: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                    },
                },
            },
        });
        if (!purchase) {
            throw new common_1.NotFoundException(`Purchase with id ${id} not found`);
        }
        if (purchase.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return purchase;
    }
    async create(data, tenantId) {
        const { supplierId, branchId, notes, items } = data;
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('A purchase must have at least one item');
        }
        return this.prisma.$transaction(async (tx) => {
            const branch = await tx.branch.findUnique({ where: { id: branchId } });
            if (!branch || branch.tenantId !== tenantId) {
                throw new common_1.BadRequestException('Branch not found or does not belong to this tenant');
            }
            const productIds = items.map((i) => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, tenantId },
            });
            if (products.length !== productIds.length) {
                throw new common_1.BadRequestException('One or more products not found or do not belong to this tenant');
            }
            const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
            const purchase = await tx.purchase.create({
                data: {
                    tenantId,
                    branchId,
                    supplierId: supplierId || null,
                    notes,
                    totalAmount,
                    status: 'COMPLETED',
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });
            for (const item of items) {
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId,
                        },
                    },
                    update: {
                        quantity: { increment: item.quantity },
                    },
                    create: {
                        productId: item.productId,
                        branchId,
                        quantity: item.quantity,
                        minStock: 0,
                    },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        branchId,
                        quantity: item.quantity,
                        type: 'PURCHASE',
                        reference: `PURCHASE-${purchase.id}`,
                        balance: 0,
                    },
                });
                await tx.product.update({
                    where: { id: item.productId },
                    data: { costPrice: item.costPrice },
                });
            }
            return purchase;
        });
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map