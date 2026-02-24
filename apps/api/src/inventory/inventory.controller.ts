import { Controller, Get, Param, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('kardex/:productId')
  async getKardex(
    @Param('productId') productId: string,
    @Query('branchId') branchId: string,
  ) {
    return this.inventoryService.getKardex(productId, branchId);
  }
}
