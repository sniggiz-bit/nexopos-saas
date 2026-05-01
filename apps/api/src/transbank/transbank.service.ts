import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordTransactionDto } from './dto/record-transaction.dto';

@Injectable()
export class TransbankService {
  private readonly logger = new Logger(TransbankService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordTransaction(dto: RecordTransactionDto) {
    const { tenantId, branchId, saleId, orderId, amount, transbankResponse } = dto;

    // Idempotencia: si ya existe el orderId, retornar el registro existente
    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { orderId },
    });
    if (existing) {
      this.logger.warn(`Duplicate payment attempt for orderId ${orderId} — returning existing record`);
      return existing;
    }

    const status = transbankResponse.success ? 'APPROVED' : 'REJECTED';

    // Sanitizar: no guardar datos sensibles del SDK crudo
    const safeResponse = {
      responseCode:      transbankResponse.responseCode,
      responseMessage:   transbankResponse.responseMessage,
      authorizationCode: transbankResponse.authorizationCode,
      cardType:          transbankResponse.cardType,
      lastFourDigits:    transbankResponse.lastFourDigits,
      ticket:            transbankResponse.ticket,
      terminalId:        transbankResponse.terminalId ?? null,
      installments:      transbankResponse.installments ?? 0,
    };

    const record = await this.prisma.paymentTransaction.create({
      data: {
        tenantId,
        branchId,
        saleId:            saleId ?? null,
        orderId,
        amount,
        status:            status as any,
        provider:          'TRANSBANK_POS',
        responseCode:      transbankResponse.responseCode,
        authorizationCode: transbankResponse.authorizationCode,
        responseMessage:   transbankResponse.responseMessage,
        cardType:          transbankResponse.cardType,
        lastFourDigits:    transbankResponse.lastFourDigits,
        installments:      transbankResponse.installments ?? 0,
        rawResponse:       safeResponse,
      },
    });

    this.logger.log(
      `PaymentTransaction recorded: orderId=${orderId} status=${status} amount=${amount} auth=${transbankResponse.authorizationCode}`,
    );

    return record;
  }

  async findByOrderId(orderId: string) {
    return this.prisma.paymentTransaction.findUnique({ where: { orderId } });
  }

  async findByTenant(tenantId: string, limit = 50) {
    return this.prisma.paymentTransaction.findMany({
      where:   { tenantId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
  }

  async linkToSale(orderId: string, saleId: string) {
    return this.prisma.paymentTransaction.update({
      where: { orderId },
      data:  { saleId },
    });
  }
}
