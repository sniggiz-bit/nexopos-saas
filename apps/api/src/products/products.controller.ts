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
  ) {
    return this.productsService.findCritical(tenantId);
  }

  /**
   * GET /products
   * Returns all products with calculated stock
   *
   * @param tenantId - Tenant ID (required for multi-tenancy)
   * @param branchId - Branch ID (optional, defaults to 'branch-1')
   * @returns Array of products with stock information
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('tenantId') tenantIdParam?: string,
  ): Promise<ProductResponseDto[]> {
    const tenantId = user?.tenantId || tenantIdParam || 'tenant-1';
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
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id, user.tenantId);
  }

  /**
   * POST /products
   * Creates a new product
   *
   * @param createProductDto - Product data
   * @returns Created product
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<ProductResponseDto> {
    createProductDto.tenantId = user.tenantId;
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
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto, req.user?.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
