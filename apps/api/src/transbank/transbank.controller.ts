import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { TransbankService } from './transbank.service';
import { RecordTransactionDto } from './dto/record-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import type { TransbankBranchSettings } from './transbank.types';

@Controller('transbank')
@UseGuards(JwtAuthGuard)
export class TransbankController {
  constructor(private readonly transbankService: TransbankService) {}

  // Registrar resultado de transacción Transbank (llamado por el frontend tras respuesta del agente local)
  @Post('record')
  recordTransaction(@Body() dto: RecordTransactionDto) {
    return this.transbankService.recordTransaction(dto);
  }

  // Obtener transacción por orderId (para verificar idempotencia)
  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.transbankService.findByOrderId(orderId);
  }

  // Historial de transacciones del tenant
  @Get('history')
  findByTenant(@CurrentUser() user: any) {
    return this.transbankService.findByTenant(user.tenantId);
  }

  // Vincular transacción a venta (se llama al completar la venta)
  @Post('link-sale')
  linkToSale(@Body() body: { orderId: string; saleId: string }) {
    return this.transbankService.linkToSale(body.orderId, body.saleId);
  }

  // Configuración del terminal por sucursal
  @Get('config/:branchId')
  getConfig(@Param('branchId') branchId: string, @CurrentUser() user: any) {
    return this.transbankService.getConfig(branchId, user.tenantId);
  }

  @Patch('config/:branchId')
  saveConfig(
    @Param('branchId') branchId: string,
    @Body() body: TransbankBranchSettings,
    @CurrentUser() user: any,
  ) {
    return this.transbankService.saveConfig(branchId, body, user.tenantId);
  }
}
