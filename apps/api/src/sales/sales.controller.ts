import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Get all sales with optional filters
   *
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   * @param branchId - Optional branch ID filter
   * @returns Array of sales ordered by createdAt desc (most recent first)
   *
   * @example
   * GET /sales
   * GET /sales?startDate=2026-02-01&endDate=2026-02-28
   * GET /sales?branchId=uuid-here
   */
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesService.getSales({ startDate, endDate, branchId, tenantId: user.tenantId });
  }

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
  async create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user: any) {
    console.log(
      '[SalesController] Received createSaleDto:',
      JSON.stringify(createSaleDto, null, 2),
    );
    console.log(
      '[SalesController] CurrentUser:',
      JSON.stringify(user, null, 2),
    );

    createSaleDto.tenantId = user.tenantId;
    createSaleDto.userId = user.id;

    // Use user's branchId if not provided in DTO
    if (!createSaleDto.branchId) {
      createSaleDto.branchId = user.branchId;
    }

    return this.salesService.createSale(createSaleDto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') id: string,
    @Body() payments: CreatePaymentDto[],
  ) {
    return this.salesService.completePreSale(id, payments);
  }

  @Post(':id/nota-credito')
  @HttpCode(HttpStatus.OK)
  async emitNotaCredito(@Param('id') id: string) {
    return this.salesService.emitirNotaCreditoForSale(id);
  }
}
