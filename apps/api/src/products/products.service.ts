import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all products with calculated stock from InventoryLevel
     * @param tenantId - Tenant ID for multi-tenancy
     * @param branchId - Branch ID to calculate stock (defaults to 'branch-1')
     * @returns Array of products with stock information
     */
    async findAll(
        tenantId: string,
        branchId: string = 'branch-1',
    ): Promise<ProductResponseDto[]> {
        // Fetch products with their inventory levels for the specified branch
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true, // Only return active products
            },
            include: {
                inventory: {
                    where: {
                        branchId,
                    },
                },
                category: true,
                brand: true,
            },
        });

        // Transform to response DTO with calculated stock
        return products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType as 'UNIT' | 'WEIGHT',
            image: product.image || undefined,
            isActive: product.isActive,
            stock: product.inventory.reduce(
                (total, inv) => total + Number(inv.quantity),
                0,
            ),
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

    /**
     * Get a single product by ID
     * @param id - Product ID
     * @param tenantId - Tenant ID for multi-tenancy
     * @param branchId - Branch ID to calculate stock
     * @returns Product with stock information
     */
    async findOne(
        id: string,
        tenantId: string,
        branchId: string = 'branch-1',
    ): Promise<ProductResponseDto> {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                inventory: {
                    where: {
                        branchId,
                    },
                },
                category: true,
                brand: true,
            },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType as 'UNIT' | 'WEIGHT',
            image: product.image || undefined,
            isActive: product.isActive,
            stock: product.inventory.reduce(
                (total, inv) => total + Number(inv.quantity),
                0,
            ),
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

    /**
     * Create a new product
     * @param createProductDto - Product data
     * @returns Created product with stock information
     */
    async create(
        createProductDto: CreateProductDto,
    ): Promise<ProductResponseDto> {
        const { tenantId, barcode, ...productData } = createProductDto;

        // Validate barcode uniqueness per tenant if provided
        if (barcode) {
            const existingProduct = await this.prisma.product.findFirst({
                where: {
                    barcode,
                    tenantId,
                },
            });

            if (existingProduct) {
                throw new ConflictException(
                    `El código de barras ${barcode} ya existe para este tenant`,
                );
            }
        }

        // Create product with default values for optional fields
        const product = await this.prisma.product.create({
            data: {
                ...productData,
                barcode,
                tenantId,
                costPrice: productData.costPrice ?? 0,
                minStock: productData.minStock ?? 0,
                unitType: productData.unitType ?? 'UNIT',
                isActive: productData.isActive ?? true,
                // If initialStock is provided, create inventory entry in transaction (implicit in nested create)
                inventory: {
                    create: createProductDto.initialStock ? [
                        {
                            branchId: 'branch-1', // Default branch
                            quantity: new Prisma.Decimal(createProductDto.initialStock),
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

        // Calculate stock
        const stock = product.inventory.reduce(
            (total, inv) => total + inv.quantity.toNumber(),
            0,
        );

        return {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType as 'UNIT' | 'WEIGHT',
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

    /**
     * Update an existing product
     * @param id - Product ID
     * @param updateProductDto - Updated product data
     * @returns Updated product
     */
    async update(
        id: string,
        updateProductDto: UpdateProductDto,
    ): Promise<ProductResponseDto> {
        // Validate barcode uniqueness if barcode is being updated
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
                throw new ConflictException(
                    `Product with barcode ${updateProductDto.barcode} already exists for this tenant`,
                );
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
                // Handle stock update via upsert for the default branch
                inventory: updateProductDto.stock !== undefined ? {
                    upsert: {
                        where: {
                            productId_branchId: {
                                productId: id,
                                branchId: 'branch-1',
                            }
                        },
                        create: {
                            branchId: 'branch-1',
                            quantity: new Prisma.Decimal(updateProductDto.stock),
                        },
                        update: {
                            quantity: new Prisma.Decimal(updateProductDto.stock),
                        }
                    }
                } : undefined,
            },
            include: {
                category: true,
                brand: true,
                inventory: true,
            },
        });

        return {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            minStock: product.minStock,
            unitType: product.unitType as 'UNIT' | 'WEIGHT',
            image: product.image || undefined,
            isActive: product.isActive,
            stock: product.inventory.reduce(
                (total, inv) => total + Number(inv.quantity),
                0,
            ),
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

    /**
     * Soft delete a product
     * @param id - Product ID
     */
    async remove(id: string): Promise<void> {
        await this.prisma.product.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
}

