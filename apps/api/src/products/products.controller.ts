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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

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
