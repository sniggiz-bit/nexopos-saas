import { Body, Controller, Get, Param, Post, Query, Request, BadRequestException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}
  @Post('open')
  openShift(@Body() body: { branchId: string; initialAmount: number }, @Request() req: any) {
    if (!body.branchId || !Number.isFinite(body.initialAmount) || body.initialAmount < 0) throw new BadRequestException('Sucursal y monto inicial válidos son obligatorios.');
    return this.shiftsService.openShift(req.user.tenantId, body.branchId, req.user.sub, body.initialAmount);
  }
  @Post('close')
  closeShift(@Body() body: { shiftId: string; finalAmount: number }, @Request() req: any) {
    if (!body.shiftId || !Number.isFinite(body.finalAmount) || body.finalAmount < 0) throw new BadRequestException('Caja y monto final válidos son obligatorios.');
    return this.shiftsService.closeShift(body.shiftId, req.user.sub, body.finalAmount);
  }
  @Get('current/:branchId')
  getCurrentShift(@Param('branchId') branchId: string) { return this.shiftsService.getCurrentShift(branchId); }
  @Get('summary/:shiftId')
  getShiftSummary(@Param('shiftId') shiftId: string) { return this.shiftsService.getShiftSummary(shiftId); }
  @Get('history')
  getShiftHistory(@Request() req: any, @Query('branchId') branchId?: string, @Query('page') page?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.shiftsService.getShiftHistory(req.user.tenantId, branchId, Math.max(1, parseInt(page || '1', 10) || 1), 20, from, to);
  }
}
