import { IsString, IsInt, IsOptional, IsObject, Min, IsUUID } from 'class-validator';

export class RecordTransactionDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsUUID()
  saleId?: string;

  @IsString()
  orderId: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsObject()
  transbankResponse: {
    responseCode: number;
    authorizationCode: string;
    responseMessage: string;
    success: boolean;
    amount: number;
    cardType: string;
    lastFourDigits: string;
    ticket: string;
    realDate: string;
    realTime: string;
    installments?: number;
    terminalId?: string;
  };
}
