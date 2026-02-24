import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products/critical
   * Returns products with stock <= minStock
   *
   * @param tenantId - Tenant ID
   * @param branchId - Branch ID
   */
  @Get('critical')
  async findCritical(
    @Query('tenantId') tenantId: string = 'tenant-1',
    @Query('branchId') branchId?: string,
  ) {
    return this.productsService.findCritical(tenantId, branchId);
  }

  /**
   * GET /products
   * Returns all products with calculated stock
   *
   * @param tenantId - Tenant ID (required for multi-tenancy)
   * @param branchId - Branch ID (optional, defaults to 'branch-1')
   * @returns Array of products with stock information
   */
  @Get()
  async findAll(
    @Query('tenantId') tenantId: string = 'tenant-1', // Default tenant for development
  ): Promise<ProductResponseDto[]> {
    return this.productsService.findAll(tenantId);
  }

  /**
   * GET /products/:id
   * Returns a single product by ID
   *
   * @param id - Product ID
   * @param tenantId - Tenant ID
   * @param branchId - Branch ID
   * @returns Product with stock information
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string = 'tenant-1',
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id, tenantId);
  }

  /**
   * POST /products
   * Creates a new product
   *
   * @param createProductDto - Product data
   * @returns Created product
   */
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
  }

  /**
   * PATCH /products/:id
   * Updates an existing product
   *
   * @param id - Product ID
   * @param updateProductDto - Updated product data
   * @returns Updated product
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * DELETE /products/:id
   * Soft deletes a product
   *
   * @param id - Product ID
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
  @Patch('bulk-public')
  async bulkUpdatePublic(
    @Body() body: { ids: string[]; isPublic: boolean },
    @Query('tenantId') tenantId: string = 'tenant-1',
  ) {
    return this.productsService.bulkUpdatePublicStatus(
      tenantId,
      body.ids,
      body.isPublic,
    );
  }
}
