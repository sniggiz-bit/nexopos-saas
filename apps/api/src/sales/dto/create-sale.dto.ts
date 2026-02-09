import { IsString, IsUUID, IsArray, ValidateNested, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    TRANSFER = 'TRANSFER',
    DEBIT = 'DEBIT',
}

export class CreateSaleItemDto {
    @IsUUID()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    // Price is NO LONGER sent by client - fetched from DB for security
}

export class CreateSaleDto {
    @IsUUID()
    tenantId: string;

    @IsUUID()
    branchId: string;

    @IsUUID()
    @IsOptional()
    userId?: string;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleItemDto)
    items: CreateSaleItemDto[];
}
