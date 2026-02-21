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
            inventoryLevels: product.inventory.map(inv => ({
                branchId: inv.branchId,
                branchName: inv.branch?.name || 'Desconocida',
                quantity: Number(inv.quantity),
            })),
            category: product.category ? {
                id: product.category.id,
                name: product.category.name,
            } : undefined,
            brand: product.brand ? {
                id: product.brand.id,
                name: product.brand.name,
            } : undefined,
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
            inventoryLevels: product.inventory.map(inv => ({
                branchId: inv.branchId,
                branchName: inv.branch?.name || 'Desconocida',
                quantity: Number(inv.quantity),
            })),
            category: product.category ? {
                id: product.category.id,
                name: product.category.name,
            } : undefined,
            brand: product.brand ? {
                id: product.brand.id,
                name: product.brand.name,
            } : undefined,
        };
    }
    async create(createProductDto) {
        const { tenantId, barcode, ...productData } = createProductDto;
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
                    create: createProductDto.initialStock ? [
                        {
                            branchId: 'branch-1',
                            quantity: new client_1.Prisma.Decimal(createProductDto.initialStock),
                        }
                    ] : [],
                },
                stockMovements: {
                    create: createProductDto.initialStock ? [
                        {
                            branchId: 'branch-1',
                            quantity: new client_1.Prisma.Decimal(createProductDto.initialStock),
                            type: 'INITIAL',
                            balance: new client_1.Prisma.Decimal(createProductDto.initialStock),
                            reference: 'Inventario Inicial',
                        }
                    ] : [],
                },
            },
            include: {
                category: true,
                brand: true,
                inventory: true,
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
            category: product.category ? {
                id: product.category.id,
                name: product.category.name,
            } : undefined,
            brand: product.brand ? {
                id: product.brand.id,
                name: product.brand.name,
            } : undefined,
        };
    }
    async update(id, updateProductDto) {
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
            },
            include: {
                category: true,
                brand: true,
                inventory: true,
            },
        });
        if (updateProductDto.stock !== undefined) {
            const newStock = new client_1.Prisma.Decimal(updateProductDto.stock);
            const branchId = 'branch-1';
            const currentInv = await this.prisma.inventory.findUnique({
                where: { productId_branchId: { productId: id, branchId } }
            });
            const currentQty = currentInv ? currentInv.quantity : new client_1.Prisma.Decimal(0);
            const diff = newStock.minus(currentQty);
            if (!diff.equals(0)) {
                await this.prisma.$transaction([
                    this.prisma.inventory.upsert({
                        where: { productId_branchId: { productId: id, branchId } },
                        create: { productId: id, branchId, quantity: newStock },
                        update: { quantity: newStock }
                    }),
                    this.prisma.stockMovement.create({
                        data: {
                            productId: id,
                            branchId,
                            quantity: diff,
                            type: 'ADJUSTMENT',
                            balance: newStock,
                            reference: 'Ajuste Manual',
                        }
                    })
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