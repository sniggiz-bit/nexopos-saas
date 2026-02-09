import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    /**
     * Create a new sale with ACID transaction guarantees
     * 
     * SECURITY: Prices are fetched from the database, not from client input.
     * 
     * @param createSaleDto - Sale data including items and payment method
     * @returns Created sale with all related data
     * 
     * @throws BadRequestException if:
     * - Insufficient stock for any item
     * - Product not found or doesn't belong to tenant
     * - Invalid branch or tenant
     * - Empty items array
     * 
     * @example
     * POST /sales
     * {
     *   "tenantId": "uuid-here",
     *   "branchId": "uuid-here",
     *   "userId": "uuid-here",
     *   "paymentMethod": "CASH",
     *   "items": [
     *     { "productId": "product-uuid", "quantity": 2 }
     *   ]
     * }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.createSale(createSaleDto);
    }
}
