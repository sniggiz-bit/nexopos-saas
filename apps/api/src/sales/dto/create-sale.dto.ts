import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsUUID,
  IsNotEmpty,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateSaleItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class OfflineSaleDto {
  @IsUUID('4')
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  shiftId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  operatorId: string;

  @IsISO8601({ strict: true })
  recordedAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  receiptReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  paymentReference?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OfflineSaleDto)
  offline?: OfflineSaleDto;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments: CreatePaymentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsOptional()
  @IsEnum(['COMPLETED', 'PRE_SALE'])
  status?: 'COMPLETED' | 'PRE_SALE';

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsNumber()
  dteType?: number;
}
