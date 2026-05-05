import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MovementType } from '@prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('kardex/:productId')
  async getKardex(
    @Param('productId') productId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.getKardex(productId, branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('adjust')
  async adjustStock(@Body() body: any, @Request() req: any) {
    const { productId, branchId, quantity, note } = body;
    return this.inventoryService.logMovement({
      productId,
      branchId,
      quantity: Number(quantity),
      type: MovementType.ADJUSTMENT,
      reference: note || 'Ajuste manual',
      userId: req.user?.userId,
    });
  }
}
