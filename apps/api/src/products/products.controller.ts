import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

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
        @Query('branchId') branchId?: string,
    ): Promise<ProductResponseDto[]> {
        return this.productsService.findAll(tenantId, branchId);
    }
}
