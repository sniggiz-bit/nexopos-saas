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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SalesService = class SalesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSale(createSaleDto) {
        const { tenantId, branchId, userId, items, paymentMethod } = createSaleDto;
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Sale must contain at least one item');
        }
        return this.prisma.$transaction(async (prisma) => {
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
                return acc + (priceFromDB * item.quantity);
            }, 0);
            const sale = await prisma.sale.create({
                data: {
                    tenantId,
                    branchId,
                    userId,
                    total,
                    paymentMethod,
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
            return sale;
        });
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map