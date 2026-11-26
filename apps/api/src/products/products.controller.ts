import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ImportProductRowDto } from './dto/import-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products/critical
   * Returns products with stock <= minStock for the authenticated tenant
   */
  @Get('critical')
  async findCritical(@CurrentUser() user: any) {
    return this.productsService.findCritical(user.tenantId);
  }

  @Get('duplicates')
  async findDuplicates(@CurrentUser() user: any) {
    return this.productsService.findDuplicateProducts(user.tenantId);
  }

  /**
   * GET /products
   * Returns paginated products for the authenticated tenant.
   *
   * @param search     - Optional text search (name, SKU, barcode)
   * @param categoryId - Optional category filter
   * @param page       - Page number (default: 1)
   * @param limit      - Items per page (default: 50, max: 200)
   */
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('search')     search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('page')       page?: string,
    @Query('limit')      limit?: string,
  ) {
    return this.productsService.findAll(user.tenantId, {
      search,
      categoryId,
      supplierId,
      branchId: user.branchId,
      page:  page  ? parseInt(page,  10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /products/:id
   * Returns a single product by ID for the authenticated tenant
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id, user.tenantId, user.branchId);
  }

  /**
   * POST /products
   * Creates a new product for the authenticated tenant
   */
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<ProductResponseDto> {
    createProductDto.tenantId = user.tenantId;
    return this.productsService.create(createProductDto);
  }

  /**
   * Import product rows in bounded batches.
   */
  @Post('import')
  async importProducts(
    @Body() body: { rows?: ImportProductRowDto[] },
    @CurrentUser() user: any,
  ) {
    if (!Array.isArray(body?.rows) || body.rows.length === 0) {
      throw new BadRequestException('Se requiere una lista de productos para importar.');
    }
    if (body.rows.length > 100) {
      throw new BadRequestException('La importación acepta hasta 100 filas por solicitud.');
    }

    return this.productsService.importProducts(
      user.tenantId,
      user.branchId,
      user.sub,
      body.rows,
    );
  }

  /**
   * PATCH /products/bulk-public
   * Bulk update public status for products
   */
  @Patch('bulk-public')
  async bulkUpdatePublic(
    @Body() body: { ids: string[]; isPublic: boolean },
    @Request() req: any,
  ) {
    return this.productsService.bulkUpdatePublicStatus(
      req.user.tenantId,
      body.ids,
      body.isPublic,
    );
  }

  @Patch('deactivate-duplicates')
  async deactivateDuplicates(
    @Body() body: { ids?: unknown[] },
    @CurrentUser() user: any,
  ) {
    const ids = body?.ids;
    if (
      !Array.isArray(ids)
      || ids.length === 0
      || ids.length > 5000
      || ids.some(id => typeof id !== 'string' || !id.trim())
    ) {
      throw new BadRequestException('Selecciona entre 1 y 5000 productos válidos para desactivar.');
    }
    const productIds = ids.filter(
      (id): id is string => typeof id === 'string' && Boolean(id.trim()),
    );

    return this.productsService.deactivateDuplicateProducts(
      user.tenantId,
      productIds,
    );
  }

  @Post('duplicates/cleanup')
  async cleanupDuplicates(
    @Body() body: { ids?: unknown[] },
    @CurrentUser() user: any,
  ) {
    const ids = body?.ids;
    if (
      !Array.isArray(ids)
      || ids.length === 0
      || ids.length > 100
      || ids.some(id => typeof id !== 'string' || !id.trim())
    ) {
      throw new BadRequestException('Selecciona entre 1 y 100 productos válidos por lote.');
    }

    return this.productsService.cleanupDuplicateProducts(
      user.tenantId,
      ids.filter((id): id is string => typeof id === 'string' && Boolean(id.trim())),
    );
  }

  /**
   * PATCH /products/:id
   * Updates an existing product
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(
      id,
      req.user.tenantId,
      updateProductDto,
      req.user?.sub,
    );
  }

  /**
   * DELETE /products/:id
   * Deletes a product for the authenticated tenant
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.productsService.remove(id, user.tenantId);
  }
}
