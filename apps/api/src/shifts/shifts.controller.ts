import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) { }

  @Post('open')
  async openShift(
    @Body()
    body: {
      branchId: string;
      initialAmount: number;
      userId: string;
      tenantId: string;
    },
  ) {
    // In a real app, userId and tenantId would come from the authenticated user (Request)
    // For now, we accept them in the body as per the existing simplified auth pattern in this project
    const { branchId, initialAmount, userId, tenantId } = body;

    if (!branchId || initialAmount === undefined || !userId || !tenantId) {
      throw new BadRequestException('Missing required fields');
    }

    return this.shiftsService.openShift(
      tenantId,
      branchId,
      userId,
      initialAmount,
    );
  }

  @Post('close')
  async closeShift(
    @Body() body: { shiftId: string; userId: string; finalAmount: number },
  ) {
    const { shiftId, userId, finalAmount } = body;

    if (!shiftId || !userId || finalAmount === undefined) {
      throw new BadRequestException('Missing required fields');
    }

    return this.shiftsService.closeShift(shiftId, userId, finalAmount);
  }

  @Get('current/:branchId')
  async getCurrentShift(@Param('branchId') branchId: string) {
    return this.shiftsService.getCurrentShift(branchId);
  }
}
