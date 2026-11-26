import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PriceTierDto } from './dto/price-tier.dto';
import {
  ImportProductRowDto,
  ImportProductRowResultDto,
  ImportProductsResultDto,
} from './dto/import-product.dto';
import {
  DeactivateDuplicateProductsResultDto,
  DuplicateProductCandidateDto,
  DuplicateProductGroupDto,
} from './dto/duplicate-products.dto';
import { Prisma } from '@prisma/client';

interface ProductImportIdentity {
  id: string;
  sku: string | null;
  barcode: string | null;
}

interface ProductDuplicateCandidate {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  costPrice: number;
  category: { name: string } | null;
  brand: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  inventory: Array<{
    branchId: string;
    quantity: Prisma.Decimal;
    branch: { name: string };
  }>;
}

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
      supplierId?: string;
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
      ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
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
      supplier: true,
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
      supplier: product.supplier
        ? { id: product.supplier.id, name: product.supplier.name }
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
        supplier: true,
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
      supplier: product.supplier
        ? {
          id: product.supplier.id,
          name: product.supplier.name,
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

    if (productData.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: productData.supplierId, tenantId },
      });
      if (!supplier) {
        throw new NotFoundException('Proveedor no encontrado o no pertenece al inquilino');
      }
    }

    const sku = this.cleanImportText(productData.sku);
    if (sku) {
      productData.sku = sku;
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          tenantId,
          isActive: true,
          sku: { equals: sku, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (existingProduct) {
        throw new ConflictException(`El SKU ${sku} ya existe para este tenant.`);
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
        supplier: true,
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
      supplier: product.supplier
        ? {
          id: product.supplier.id,
          name: product.supplier.name,
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
    stockBranchId?: string,
  ): Promise<ProductResponseDto> {
    const existingProductForValidation = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existingProductForValidation) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const nextSku = this.cleanImportText(updateProductDto.sku);
    const currentSku = this.cleanImportText(existingProductForValidation.sku);
    if (
      nextSku
      && this.normalizeImportName(nextSku) !== this.normalizeImportName(currentSku ?? '')
    ) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          tenantId,
          isActive: true,
          sku: { equals: nextSku, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (existingSku) {
        throw new ConflictException(`El SKU ${nextSku} ya existe para este tenant.`);
      }
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

    if (updateProductDto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: updateProductDto.supplierId, tenantId },
      });
      if (!supplier) {
        throw new NotFoundException('Proveedor no encontrado o no pertenece al inquilino');
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
        sku: updateProductDto.sku?.trim(),
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
        supplierId: updateProductDto.supplierId,
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
        supplier: true,
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
      const fallbackBranch = stockBranchId || existingInv ? null : await this.prisma.branch.findFirst({
        where: { tenantId: existingProductForValidation.tenantId },
        orderBy: { id: 'asc' },
      });
      const branchId = stockBranchId ?? existingInv?.branchId ?? fallbackBranch?.id;
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

  async importProducts(
    tenantId: string,
    requestedBranchId: string | null | undefined,
    userId: string | undefined,
    rows: ImportProductRowDto[],
  ): Promise<ImportProductsResultDto> {
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const brands = await this.prisma.brand.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, sku: true, barcode: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const selectedBranch = requestedBranchId
      ? await this.prisma.branch.findFirst({
          where: { id: requestedBranchId, tenantId },
          select: { id: true },
        })
      : null;
    const fallbackBranch = selectedBranch
      ? null
      : await this.prisma.branch.findFirst({
          where: { tenantId },
          orderBy: { id: 'asc' },
          select: { id: true },
        });
    const branchId = selectedBranch?.id ?? fallbackBranch?.id;

    const categoryIds = new Map(
      categories.map(category => [this.normalizeImportName(category.name), category.id]),
    );
    const brandIds = new Map(
      brands.map(brand => [this.normalizeImportName(brand.name), brand.id]),
    );
    const productsBySku = new Map<string, ProductImportIdentity[]>();
    const productsByBarcode = new Map<string, ProductImportIdentity>();
    const indexProduct = (product: ProductImportIdentity) => {
      if (product.sku) {
        const key = this.normalizeImportName(product.sku);
        const matches = productsBySku.get(key) ?? [];
        matches.push(product);
        productsBySku.set(key, matches);
      }
      if (product.barcode) {
        productsByBarcode.set(this.normalizeImportName(product.barcode), product);
      }
    };
    const unindexProduct = (product: ProductImportIdentity) => {
      if (product.sku) {
        const key = this.normalizeImportName(product.sku);
        const matches = (productsBySku.get(key) ?? []).filter(match => match.id !== product.id);
        if (matches.length) productsBySku.set(key, matches);
        else productsBySku.delete(key);
      }
      if (product.barcode) {
        const key = this.normalizeImportName(product.barcode);
        if (productsByBarcode.get(key)?.id === product.id) productsByBarcode.delete(key);
      }
    };
    for (const product of products) {
      const identity = { id: product.id, sku: product.sku, barcode: product.barcode };
      indexProduct(identity);
    }

    const results: ImportProductRowResultDto[] = [];
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = Number.isInteger(row?.rowNumber) ? row.rowNumber : index + 1;
      const name = this.cleanImportText(row?.name);
      const sku = this.cleanImportText(row?.sku);
      const barcode = this.cleanImportText(row?.barcode);
      const categoryName = this.cleanImportText(row?.category);
      const brandName = this.cleanImportText(row?.brand);
      const warnings = Array.isArray(row?.warnings)
        ? row.warnings.filter((warning): warning is string => typeof warning === 'string')
        : [];

      try {
        const skuKey = sku ? this.normalizeImportName(sku) : '';
        const barcodeKey = barcode ? this.normalizeImportName(barcode) : '';
        const skuMatches = skuKey ? productsBySku.get(skuKey) ?? [] : [];
        const existing = skuMatches[0]
          ?? (!sku && barcodeKey ? productsByBarcode.get(barcodeKey) : undefined);

        if (!existing && !name) {
          results.push({
            rowNumber,
            name,
            sku,
            outcome: 'skipped',
            message: 'No se puede crear un producto sin nombre ni coincidencia por SKU/código.',
            warnings,
          });
          continue;
        }
        if (skuMatches.length > 1) {
          warnings.push('Hay varios productos con este SKU; se actualizó el más antiguo.');
        }

        let safeBarcode = barcode;
        if (barcodeKey) {
          const barcodeOwner = productsByBarcode.get(barcodeKey);
          if (barcodeOwner && barcodeOwner.id !== existing?.id) {
            safeBarcode = undefined;
            warnings.push('El código de barras ya pertenece a otro producto; se importó sin ese código.');
          }
        }

        const categoryId = categoryName
          ? await this.resolveImportCategory(categoryName, tenantId, categoryIds, warnings)
          : undefined;
        const brandId = brandName
          ? await this.resolveImportBrand(brandName, tenantId, brandIds, warnings)
          : undefined;
        const price = this.importNumber(row.price, true, 'Precio', warnings);
        const costPrice = this.importNumber(row.costPrice, true, 'Costo', warnings);
        const stock = this.importNumber(row.stock, false, 'Stock', warnings);
        const minStock = this.importNumber(row.minStock, true, 'Stock mínimo', warnings);
        const unitType = row.unitType === 'UNIT' || row.unitType === 'WEIGHT'
          ? row.unitType
          : undefined;

        if (!sku && !barcode) {
          warnings.push('El producto no tiene SKU ni código de barras para futuras actualizaciones automáticas.');
        }
        if (!existing && price === undefined) {
          warnings.push('El producto nuevo quedará con precio 0 porque no se recibió un precio válido.');
        }
        if (row.stock !== undefined && stock !== undefined && !branchId) {
          warnings.push('No hay sucursal disponible; el stock no se pudo asignar.');
        }

        let resultId: string;
        let outcome: 'created' | 'updated';
        if (existing) {
          const updateData: UpdateProductDto = {
            ...(name ? { name } : {}),
            ...(sku ? { sku } : {}),
            ...(safeBarcode ? { barcode: safeBarcode } : {}),
            ...(price !== undefined ? { price } : {}),
            ...(costPrice !== undefined ? { costPrice } : {}),
            ...(minStock !== undefined ? { minStock } : {}),
            ...(unitType ? { unitType } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(brandId ? { brandId } : {}),
            ...(stock !== undefined && branchId ? { stock } : {}),
          };
          let updated: ProductResponseDto;
          try {
            updated = await this.update(existing.id, tenantId, updateData, userId, branchId);
          } catch (error) {
            if (!safeBarcode || !this.isImportBarcodeConflict(error)) throw error;
            safeBarcode = undefined;
            delete updateData.barcode;
            warnings.push('El código de barras ya pertenece a otro producto; se importó sin ese código.');
            updated = await this.update(existing.id, tenantId, updateData, userId, branchId);
          }
          resultId = updated.id;
          outcome = 'updated';
        } else {
          const createData: CreateProductDto = {
            name: name!,
            sku,
            barcode: safeBarcode,
            price: price ?? 0,
            costPrice: costPrice ?? 0,
            minStock: minStock ?? 0,
            unitType,
            categoryId,
            brandId,
            initialStock: stock !== undefined && branchId ? stock : undefined,
            branchId,
            tenantId,
            isActive: true,
          };
          let created: ProductResponseDto;
          try {
            created = await this.create(createData);
          } catch (error) {
            if (!safeBarcode || !this.isImportBarcodeConflict(error)) throw error;
            safeBarcode = undefined;
            createData.barcode = undefined;
            warnings.push('El código de barras ya pertenece a otro producto; se importó sin ese código.');
            created = await this.create(createData);
          }
          resultId = created.id;
          outcome = 'created';
        }

        const oldIdentity = existing ?? { id: resultId, sku: null, barcode: null };
        unindexProduct(oldIdentity);
        const newIdentity: ProductImportIdentity = {
          id: resultId,
          sku: sku ?? existing?.sku ?? null,
          barcode: safeBarcode ?? existing?.barcode ?? null,
        };
        indexProduct(newIdentity);

        results.push({ rowNumber, name, sku, outcome, warnings });
      } catch (error) {
        results.push({
          rowNumber,
          name,
          sku,
          outcome: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido al importar la fila.',
          warnings,
        });
      }
    }

    return {
      created: results.filter(result => result.outcome === 'created').length,
      updated: results.filter(result => result.outcome === 'updated').length,
      skipped: results.filter(result => result.outcome === 'skipped').length,
      errors: results.filter(result => result.outcome === 'error').length,
      results,
    };
  }

  private cleanImportText(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const cleaned = value.trim();
    return cleaned || undefined;
  }

  private normalizeImportName(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }

  private isImportBarcodeConflict(error: unknown): boolean {
    if (error instanceof ConflictException) {
      return /barcode|c[oó]digo de barras/i.test(error.message);
    }
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private importNumber(
    value: unknown,
    integer: boolean,
    fieldName: string,
    warnings: string[],
  ): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      warnings.push(`${fieldName} no es un número válido; se conservó el valor anterior o se usó 0.`);
      return undefined;
    }
    return integer ? Math.round(parsed) : Math.round(parsed * 1000) / 1000;
  }

  private async resolveImportCategory(
    name: string,
    tenantId: string,
    cache: Map<string, string>,
    warnings: string[],
  ): Promise<string> {
    const key = this.normalizeImportName(name);
    const cachedId = cache.get(key);
    if (cachedId) return cachedId;

    const category = await this.prisma.category.findFirst({
      where: { tenantId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (category) {
      cache.set(key, category.id);
      return category.id;
    }

    try {
      const created = await this.prisma.category.create({
        data: { name, tenantId },
        select: { id: true },
      });
      cache.set(key, created.id);
      warnings.push(`Se creó la categoría "${name}".`);
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const duplicate = await this.prisma.category.findFirst({
          where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          select: { id: true },
        });
        if (duplicate) {
          cache.set(key, duplicate.id);
          return duplicate.id;
        }
      }
      throw error;
    }
  }

  private async resolveImportBrand(
    name: string,
    tenantId: string,
    cache: Map<string, string>,
    warnings: string[],
  ): Promise<string> {
    const key = this.normalizeImportName(name);
    const cachedId = cache.get(key);
    if (cachedId) return cachedId;

    const brand = await this.prisma.brand.findFirst({
      where: { tenantId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (brand) {
      cache.set(key, brand.id);
      return brand.id;
    }

    try {
      const created = await this.prisma.brand.create({
        data: { name, tenantId },
        select: { id: true },
      });
      cache.set(key, created.id);
      warnings.push(`Se creó la marca "${name}".`);
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const duplicate = await this.prisma.brand.findFirst({
          where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          select: { id: true },
        });
        if (duplicate) {
          cache.set(key, duplicate.id);
          return duplicate.id;
        }
      }
      throw error;
    }
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

  async findDuplicateProducts(tenantId: string): Promise<DuplicateProductGroupDto[]> {
    const products = await this.findActiveDuplicateCandidates(tenantId);
    return this.buildDuplicateProductGroups(products);
  }

  async deactivateDuplicateProducts(
    tenantId: string,
    ids: string[],
  ): Promise<DeactivateDuplicateProductsResultDto> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('Selecciona al menos un producto para desactivar.');
    }

    const products = await this.findActiveDuplicateCandidates(tenantId);
    const groups = this.buildDuplicateProductGroups(products);
    const groupProductIds = new Set(groups.flatMap(group => group.products.map(product => product.id)));
    const selectedIds = new Set(uniqueIds);

    if (uniqueIds.some(id => !groupProductIds.has(id))) {
      throw new BadRequestException('Solo se pueden desactivar productos pertenecientes a grupos duplicados.');
    }

    const groupWithoutSurvivor = groups.find(group =>
      group.products.every(product => selectedIds.has(product.id)),
    );
    if (groupWithoutSurvivor) {
      throw new ConflictException(
        `Debes conservar al menos un producto del grupo ${groupWithoutSurvivor.identifierType} "${groupWithoutSurvivor.identifierValue}".`,
      );
    }

    const productsById = new Map(products.map(product => [product.id, product]));
    const selectedWithStock = uniqueIds
      .map(id => productsById.get(id))
      .filter((product): product is ProductDuplicateCandidate =>
        Boolean(product?.inventory.some(inventory => Number(inventory.quantity) !== 0)),
      );
    if (selectedWithStock.length > 0) {
      throw new ConflictException(
        `No se pueden desactivar productos con stock distinto de 0. Ajusta o traspasa primero: ${selectedWithStock.map(product => product.name).join(', ')}.`,
      );
    }

    const result = await this.prisma.product.updateMany({
      where: {
        tenantId,
        isActive: true,
        id: { in: uniqueIds },
      },
      data: { isActive: false },
    });

    return { deactivated: result.count };
  }

  private async findActiveDuplicateCandidates(tenantId: string): Promise<ProductDuplicateCandidate[]> {
    return this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
        costPrice: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
        inventory: {
          select: {
            branchId: true,
            quantity: true,
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildDuplicateProductGroups(
    products: ProductDuplicateCandidate[],
  ): DuplicateProductGroupDto[] {
    const groups = new Map<string, {
      identifierType: 'SKU' | 'BARCODE';
      identifierValue: string;
      products: ProductDuplicateCandidate[];
    }>();

    for (const product of products) {
      const sku = this.cleanImportText(product.sku);
      const barcode = this.cleanImportText(product.barcode);
      const identifierType = sku ? 'SKU' : barcode ? 'BARCODE' : undefined;
      const identifierValue = sku ?? barcode;
      if (!identifierType || !identifierValue) continue;

      const normalizedIdentifier = this.normalizeImportName(identifierValue);
      const groupId = `${identifierType}:${normalizedIdentifier}`;
      const group = groups.get(groupId) ?? {
        identifierType,
        identifierValue,
        products: [],
      };
      group.products.push(product);
      groups.set(groupId, group);
    }

    return [...groups.entries()]
      .filter(([, group]) => group.products.length > 1)
      .map(([groupId, group]) => ({
        groupId,
        identifierType: group.identifierType,
        identifierValue: group.identifierValue,
        products: group.products.map(product => {
          const inventory = product.inventory.map(level => ({
            branchId: level.branchId,
            branchName: level.branch.name,
            quantity: Number(level.quantity),
          }));
          return {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            price: product.price,
            costPrice: product.costPrice,
            categoryName: product.category?.name,
            brandName: product.brand?.name,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
            stock: inventory.reduce((total, level) => total + level.quantity, 0),
            inventory,
          } satisfies DuplicateProductCandidateDto;
        }),
      }))
      .sort((a, b) =>
        a.identifierType.localeCompare(b.identifierType)
        || a.identifierValue.localeCompare(b.identifierValue, 'es'),
      );
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
