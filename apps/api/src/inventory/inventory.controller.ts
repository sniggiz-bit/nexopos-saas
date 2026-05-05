import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}

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
  async adjustStock(@Body() body: AdjustStockDto, @Request() req: any) {
    return this.inventoryService.logMovement({
      productId: body.productId,
      branchId: body.branchId,
      quantity: body.quantity,
      type: 'ADJUSTMENT',
      reference: body.note || 'Ajuste manual',
      userId: req.user?.userId,
    });
  }
}
