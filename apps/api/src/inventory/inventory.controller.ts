import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MovementType } from '@prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventsService: EventsService,
  ) {}

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
    const { productId, quantity, note } = body;
    const { tenantId, branchId: userBranchId, sub } = req.user;
    const branchId = body.branchId ?? userBranchId;
    const adjustment = Number(quantity);
    if (typeof productId !== 'string' || !productId || typeof branchId !== 'string' || !branchId ||
        !Number.isFinite(adjustment) || adjustment === 0) {
      throw new BadRequestException('Se requiere un producto, una sucursal y una cantidad válida.');
    }
    const result = await this.inventoryService.adjustStock(tenantId, {
      productId,
      branchId,
      quantity: adjustment,
      type: MovementType.ADJUSTMENT,
      reference: note || 'Ajuste manual',
      userId: sub,
    });

    this.eventsService.emit({
      type: 'inventory.adjusted',
      tenantId,
      branchId,
      payload: { productId, newBalance: result.newBalance },
    });

    return result;
  }
}
