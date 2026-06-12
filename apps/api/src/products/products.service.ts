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
   * Get all products with optional server-side filtering and pagination.
   * @param tenantId  - Tenant ID for multi-tenancy
   * @param filters   - Optional search / category / pagination params
   * @returns Paginated response { data, total, page, limit, totalPages }
   */
  async findAll(
    tenantId: string,
    filters: {
      search?: string;
      categoryId?: string;
      branchId?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: ProductResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page  = Math.max(1, filters.page  ?? 1);
    const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
    const skip  = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
      isActive: true,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.search
        ? {
            OR: [
              { name:    { contains: filters.search, mode: 'insensitive' } },
              { sku:     { contains: filters.search, mode: 'insensitive' } },
              { barcode: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const include = {
      inventory: { include: { branch: true } },
      category: true,
      brand: true,
      priceTiers: { orderBy: { minQuantity: 'asc' as const } },
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const { branchId } = filters;
    const data = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || undefined,
      barcode: product.barcode || undefined,
      price: product.price,
      costPrice: product.costPrice,
      minStock: product.minStock,
      unitType: product.unitType as 'UNIT' | 'WEIGHT',
      image: product.image || undefined,
      galleryImages: product.galleryImages ?? [],
      isActive: product.isActive,
      isPublic: product.isPublic,
      stock: branchId
        ? Number(product.inventory.find(inv => inv.branchId === branchId)?.quantity ?? 0)
        : product.inventory.reduce((total, inv) => total + Number(inv.quantity), 0),
      inventoryLevels: product.inventory.map((inv) => ({
        branchId: inv.branchId,
        branchName: inv.branch?.name || 'Desconocida',
        quantity: Number(inv.quantity),
      })),
      category: product.category
        ? { id: product.category.id, name: product.category.name }
        : undefined,
      brand: product.brand
        ? { id: product.brand.id, name: product.brand.name }
        : undefined,
      priceTiers: product.priceTiers || [],
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single product by ID
   * @param id - Product ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @param branchId - Branch ID to calculate stock
   * @returns Product with stock information
   */
  async findOne(id: string, tenantId: string, branchId?: string): Promise<ProductResponseDto> {
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
      galleryImages: product.galleryImages ?? [],
      isActive: product.isActive,
      isPublic: product.isPublic,
      stock: branchId
        ? Number(product.inventory.find(inv => inv.branchId === branchId)?.quantity ?? 0)
        : product.inventory.reduce((total, inv) => total + Number(inv.quantity), 0),
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
    const { tenantId, barcode, initialStock, priceTiers, branchId, ...productData } =
      createProductDto;

    if (productData.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: productData.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Categoría no encontrada o no pertenece al inquilino');
      }
    }

    if (productData.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: productData.brandId, tenantId },
      });
      if (!brand) {
        throw new NotFoundException('Marca no encontrada o no pertenece al inquilino');
      }
    }

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
          create: initialStock && branchId
            ? [{ branchId, quantity: new Prisma.Decimal(initialStock) }]
            : [],
        },
        stockMovements: {
          create: initialStock && branchId
            ? [{
                branchId,
                quantity: new Prisma.Decimal(initialStock),
                type: 'INITIAL',
                balance: new Prisma.Decimal(initialStock),
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
      galleryImages: product.galleryImages ?? [],
      isActive: product.isActive,
      isPublic: product.isPublic,
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
   * @param tenantId - Tenant ID for multi-tenancy
   * @param updateProductDto - Updated product data
   * @returns Updated product
   */
  async update(
    id: string,
    tenantId: string,
    updateProductDto: UpdateProductDto,
    userId?: string,
  ): Promise<ProductResponseDto> {
    const existingProductForValidation = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existingProductForValidation) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: updateProductDto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Categoría no encontrada o no pertenece al inquilino');
      }
    }

    if (updateProductDto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: updateProductDto.brandId, tenantId },
      });
      if (!brand) {
        throw new NotFoundException('Marca no encontrada o no pertenece al inquilino');
      }
    }

    // Validar tramos de precio si existen
    const newPrice = updateProductDto.price !== undefined ? updateProductDto.price : existingProductForValidation.price;
    if (updateProductDto.priceTiers || updateProductDto.price !== undefined) {
      if (updateProductDto.priceTiers) {
        this.validatePriceTiers(newPrice, updateProductDto.priceTiers);
      } else {
        // Obtenmos tiers actuales solo si cambiamos el precio y no actualizamos tiers para asegurar regla negocio
        const productWithTiers = await this.prisma.product.findFirst({
          where: { id, tenantId },
          include: { priceTiers: true },
        });
        const currentTiers = productWithTiers?.priceTiers || [];
        if (currentTiers.length > 0) {
          this.validatePriceTiers(newPrice, currentTiers.map(t => ({ minQuantity: t.minQuantity, unitPrice: t.unitPrice })));
        }
      }
    }

    // Validate barcode uniqueness if barcode is being updated
    if (updateProductDto.barcode) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          barcode: updateProductDto.barcode,
          tenantId,
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
        galleryImages: updateProductDto.galleryImages,
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

      // Use existing inventory branch, or the first branch of the tenant
      const existingInv = await this.prisma.inventory.findFirst({
        where: { productId: id },
      });
      const fallbackBranch = existingInv ? null : await this.prisma.branch.findFirst({
        where: { tenantId: existingProductForValidation.tenantId },
        orderBy: { id: 'asc' },
      });
      const branchId = existingInv?.branchId ?? fallbackBranch?.id;
      if (!branchId) return this.findOne(id, existingProductForValidation.tenantId);

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
              reference: updateProductDto.stockNote || 'Ajuste Manual',
              ...(userId ? { userId } : {}),
            },
          }),
        ]);
      }
    }

    return this.findOne(id, product.tenantId);
  }

  /**
   * Soft delete a product
   * @param id - Product ID
   */
  async remove(id: string, tenantId?: string): Promise<void> {
    // Scope the soft delete to the tenant for security
    await this.prisma.product.updateMany({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      data: { isActive: false },
    });
  }
  /**
   * Find products with critical stock (<= minStock)
   */
  async findCritical(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        inventory: true,
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
