import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PriceTierDto } from './dto/price-tier.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  private validatePriceTiers(basePrice: number, priceTiers?: PriceTierDto[]) {
    if (!priceTiers || priceTiers.length === 0) return;

    // Verificar que el unitPrice sea menor al basePrice
    for (const tier of priceTiers) {
      if (tier.unitPrice >= basePrice) {
        throw new ConflictException(
          `El precio mayorista ($${tier.unitPrice}) debe ser menor al precio base ($${basePrice}).`
        );
      }
    }

    // Verificar minQuantity unicos
    const quantities = new Set<number>();
    for (const tier of priceTiers) {
      if (quantities.has(tier.minQuantity)) {
        throw new ConflictException(`La cantidad mínima ${tier.minQuantity} está duplicada en los tramos de precio.`);
      }
      quantities.add(tier.minQuantity);
    }
  }

  /**
   * Get all products with calculated stock from InventoryLevel
   * @param tenantId - Tenant ID for multi-tenancy
   * @param branchId - Branch ID to calculate stock (defaults to 'branch-1')
   * @returns Array of products with stock information
   */
  async findAll(tenantId: string): Promise<ProductResponseDto[]> {
    // Fetch products with their inventory levels for the specified branch
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true, // Only return active products
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

  /**
   * Get a single product by ID
   * @param id - Product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @param branchId - Branch ID to calculate stock
   * @returns Product with stock information
   */
  async findOne(id: string, tenantId: string): Promise<ProductResponseDto> {
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

  /**
   * Create a new product
   * @param createProductDto - Product data
   * @returns Created product with stock information
   */
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    console.log(
      '[ProductsService] Service starting with DTO:',
      JSON.stringify(createProductDto, null, 2),
    );
    const { tenantId, barcode, initialStock, priceTiers, ...productData } =
      createProductDto;

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

    // Validar tramos de precio
    this.validatePriceTiers(productData.price, createProductDto.priceTiers);

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
          create: initialStock
            ? [
              {
                branchId: 'branch-1', // Default branch
                quantity: new Prisma.Decimal(initialStock),
              },
            ]
            : [],
        },
        stockMovements: {
          create: initialStock
            ? [
              {
                branchId: 'branch-1',
                quantity: new Prisma.Decimal(initialStock),
                type: 'INITIAL',
                balance: new Prisma.Decimal(initialStock),
                reference: 'Inventario Inicial',
              },
            ]
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
    const existingProductForValidation = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProductForValidation) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Validar tramos de precio si existen
    const newPrice = updateProductDto.price !== undefined ? updateProductDto.price : existingProductForValidation.price;
    if (updateProductDto.priceTiers || updateProductDto.price !== undefined) {
      if (updateProductDto.priceTiers) {
        this.validatePriceTiers(newPrice, updateProductDto.priceTiers);
      } else {
        // Obtenmos tiers actuales solo si cambiamos el precio y no actualizamos tiers para asegurar regla negocio
        const productWithTiers = await this.prisma.product.findUnique({ where: { id }, include: { priceTiers: true } });
        const currentTiers = productWithTiers?.priceTiers || [];
        if (currentTiers.length > 0) {
          this.validatePriceTiers(newPrice, currentTiers.map(t => ({ minQuantity: t.minQuantity, unitPrice: t.unitPrice })));
        }
      }
    }

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
        priceTiers: updateProductDto.priceTiers
          ? {
            deleteMany: {}, // Delete old tiers
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
        inventory: true, // Keep this include to get tenantId for findOne call
      },
    });

    // Handle Stock Update Logging if stock is provided
    if (updateProductDto.stock !== undefined) {
      const newStock = new Prisma.Decimal(updateProductDto.stock);
      const branchId = 'branch-1';

      // Get current stock for this branch
      const currentInv = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: id, branchId } },
      });
      const currentQty = currentInv
        ? currentInv.quantity
        : new Prisma.Decimal(0);
      const diff = newStock.minus(currentQty);

      if (!diff.equals(0)) {
        await this.prisma.$transaction([
          // Update Inventory Level
          this.prisma.inventory.upsert({
            where: { productId_branchId: { productId: id, branchId } },
            create: { productId: id, branchId, quantity: newStock },
            update: { quantity: newStock },
          }),
          // Log Movement
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

    // Fetch updated product to return
    // Note: The previous query `product` might be stale regarding inventory if we just updated it above.
    // But `updateProductDto.stock` was NOT passed to the initial `prisma.product.update` call in my modified code?
    // Wait, I need to REMOVE the inventory update from the initial `prisma.product.update` if I'm doing it manually here.
    // OR better: Do everything in a transaction.

    return this.findOne(id, product.tenantId);
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
  /**
   * Find products with critical stock (<= minStock)
   */
  async findCritical(tenantId: string, branchId: string = 'branch-1') {
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
        const stock = product.inventory.reduce(
          (total, inv) => total + Number(inv.quantity),
          0,
        );
        return {
          ...product,
          stock,
        };
      })
      .filter((product) => product.stock <= product.minStock);
  }

  async bulkUpdatePublicStatus(
    tenantId: string,
    ids: string[],
    isPublic: boolean,
  ) {
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
}
