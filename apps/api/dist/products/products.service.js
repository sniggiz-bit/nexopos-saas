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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    validatePriceTiers(basePrice, priceTiers) {
        if (!priceTiers || priceTiers.length === 0)
            return;
        for (const tier of priceTiers) {
            if (tier.unitPrice >= basePrice) {
                throw new common_1.ConflictException(`El precio mayorista ($${tier.unitPrice}) debe ser menor al precio base ($${basePrice}).`);
            }
        }
        const quantities = new Set();
        for (const tier of priceTiers) {
            if (quantities.has(tier.minQuantity)) {
                throw new common_1.ConflictException(`La cantidad mínima ${tier.minQuantity} está duplicada en los tramos de precio.`);
            }
            quantities.add(tier.minQuantity);
        }
    }
    async findAll(tenantId) {
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            include: {
                inventory: {
                    include: {
                        branch: true,
                    },
                },
                category: true,
                brand: true,
                priceTiers: {
                    orderBy: { minQuantity: 'asc' },
                },
            },
        });
        return products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType,
            image: product.image || undefined,
            isActive: product.isActive,
            stock: product.inventory.reduce((total, inv) => total + Number(inv.quantity), 0),
            inventoryLevels: product.inventory.map((inv) => ({
                branchId: inv.branchId,
                branchName: inv.branch?.name || 'Desconocida',
                quantity: Number(inv.quantity),
            })),
            category: product.category
                ? {
                    id: product.category.id,
                    name: product.category.name,
                }
                : undefined,
            brand: product.brand
                ? {
                    id: product.brand.id,
                    name: product.brand.name,
                }
                : undefined,
            priceTiers: product.priceTiers || [],
        }));
    }
    async findOne(id, tenantId) {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                inventory: {
                    include: {
                        branch: true,
                    },
                },
                category: true,
                brand: true,
                priceTiers: {
                    orderBy: { minQuantity: 'asc' },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType,
            image: product.image || undefined,
            isActive: product.isActive,
            stock: product.inventory.reduce((total, inv) => total + Number(inv.quantity), 0),
            inventoryLevels: product.inventory.map((inv) => ({
                branchId: inv.branchId,
                branchName: inv.branch?.name || 'Desconocida',
                quantity: Number(inv.quantity),
            })),
            category: product.category
                ? {
                    id: product.category.id,
                    name: product.category.name,
                }
                : undefined,
            brand: product.brand
                ? {
                    id: product.brand.id,
                    name: product.brand.name,
                }
                : undefined,
            priceTiers: product.priceTiers || [],
        };
    }
    async create(createProductDto) {
        console.log('[ProductsService] Service starting with DTO:', JSON.stringify(createProductDto, null, 2));
        const { tenantId, barcode, initialStock, priceTiers, branchId, ...productData } = createProductDto;
        if (barcode) {
            const existingProduct = await this.prisma.product.findFirst({
                where: {
                    barcode,
                    tenantId,
                },
            });
            if (existingProduct) {
                throw new common_1.ConflictException(`El código de barras ${barcode} ya existe para este tenant`);
            }
        }
        this.validatePriceTiers(productData.price, createProductDto.priceTiers);
        const product = await this.prisma.product.create({
            data: {
                ...productData,
                barcode,
                tenantId,
                costPrice: productData.costPrice ?? 0,
                minStock: productData.minStock ?? 0,
                unitType: productData.unitType ?? 'UNIT',
                isActive: productData.isActive ?? true,
                inventory: {
                    create: initialStock && branchId
                        ? [{ branchId, quantity: new client_1.Prisma.Decimal(initialStock) }]
                        : [],
                },
                stockMovements: {
                    create: initialStock && branchId
                        ? [{
                                branchId,
                                quantity: new client_1.Prisma.Decimal(initialStock),
                                type: 'INITIAL',
                                balance: new client_1.Prisma.Decimal(initialStock),
                                reference: 'Inventario Inicial',
                            }]
                        : [],
                },
                priceTiers: priceTiers
                    ? {
                        create: priceTiers.map((tier) => ({
                            minQuantity: tier.minQuantity,
                            unitPrice: tier.unitPrice,
                        })),
                    }
                    : undefined,
            },
            include: {
                category: true,
                brand: true,
                inventory: true,
                priceTiers: true,
            },
        });
        const stock = product.inventory.reduce((total, inv) => total + inv.quantity.toNumber(), 0);
        return {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType,
            image: product.image || undefined,
            isActive: product.isActive,
            stock,
            category: product.category
                ? {
                    id: product.category.id,
                    name: product.category.name,
                }
                : undefined,
            brand: product.brand
                ? {
                    id: product.brand.id,
                    name: product.brand.name,
                }
                : undefined,
            priceTiers: product.priceTiers || [],
        };
    }
    async update(id, updateProductDto) {
        const existingProductForValidation = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!existingProductForValidation) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        const newPrice = updateProductDto.price !== undefined ? updateProductDto.price : existingProductForValidation.price;
        if (updateProductDto.priceTiers || updateProductDto.price !== undefined) {
            if (updateProductDto.priceTiers) {
                this.validatePriceTiers(newPrice, updateProductDto.priceTiers);
            }
            else {
                const productWithTiers = await this.prisma.product.findUnique({ where: { id }, include: { priceTiers: true } });
                const currentTiers = productWithTiers?.priceTiers || [];
                if (currentTiers.length > 0) {
                    this.validatePriceTiers(newPrice, currentTiers.map(t => ({ minQuantity: t.minQuantity, unitPrice: t.unitPrice })));
                }
            }
        }
        if (updateProductDto.barcode && updateProductDto.tenantId) {
            const existingProduct = await this.prisma.product.findFirst({
                where: {
                    barcode: updateProductDto.barcode,
                    tenantId: updateProductDto.tenantId,
                    NOT: {
                        id,
                    },
                },
            });
            if (existingProduct) {
                throw new common_1.ConflictException(`Product with barcode ${updateProductDto.barcode} already exists for this tenant`);
            }
        }
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                name: updateProductDto.name,
                sku: updateProductDto.sku,
                barcode: updateProductDto.barcode,
                price: updateProductDto.price,
                costPrice: updateProductDto.costPrice,
                minStock: updateProductDto.minStock,
                unitType: updateProductDto.unitType,
                image: updateProductDto.image,
                isActive: updateProductDto.isActive,
                categoryId: updateProductDto.categoryId,
                brandId: updateProductDto.brandId,
                priceTiers: updateProductDto.priceTiers
                    ? {
                        deleteMany: {},
                        create: updateProductDto.priceTiers.map((tier) => ({
                            minQuantity: tier.minQuantity,
                            unitPrice: tier.unitPrice,
                        })),
                    }
                    : undefined,
            },
            include: {
                category: true,
                brand: true,
                inventory: true,
            },
        });
        if (updateProductDto.stock !== undefined) {
            const newStock = new client_1.Prisma.Decimal(updateProductDto.stock);
            const existingInv = await this.prisma.inventory.findFirst({
                where: { productId: id },
            });
            const fallbackBranch = existingInv ? null : await this.prisma.branch.findFirst({
                where: { tenantId: existingProductForValidation.tenantId },
                orderBy: { id: 'asc' },
            });
            const branchId = existingInv?.branchId ?? fallbackBranch?.id;
            if (!branchId)
                return this.findOne(id, existingProductForValidation.tenantId);
            const currentInv = await this.prisma.inventory.findUnique({
                where: { productId_branchId: { productId: id, branchId } },
            });
            const currentQty = currentInv
                ? currentInv.quantity
                : new client_1.Prisma.Decimal(0);
            const diff = newStock.minus(currentQty);
            if (!diff.equals(0)) {
                await this.prisma.$transaction([
                    this.prisma.inventory.upsert({
                        where: { productId_branchId: { productId: id, branchId } },
                        create: { productId: id, branchId, quantity: newStock },
                        update: { quantity: newStock },
                    }),
                    this.prisma.stockMovement.create({
                        data: {
                            productId: id,
                            branchId,
                            quantity: diff,
                            type: 'ADJUSTMENT',
                            balance: newStock,
                            reference: 'Ajuste Manual',
                        },
                    }),
                ]);
            }
        }
        return this.findOne(id, product.tenantId);
    }
    async remove(id) {
        await this.prisma.product.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
    async findCritical(tenantId, branchId = 'branch-1') {
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            include: {
                inventory: {
                    where: { branchId },
                },
                category: true,
                brand: true,
            },
        });
        return products
            .map((product) => {
            const stock = product.inventory.reduce((total, inv) => total + Number(inv.quantity), 0);
            return {
                ...product,
                stock,
            };
        })
            .filter((product) => product.stock <= product.minStock);
    }
    async bulkUpdatePublicStatus(tenantId, ids, isPublic) {
        return this.prisma.product.updateMany({
            where: {
                tenantId,
                id: { in: ids },
            },
            data: {
                isPublic,
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map