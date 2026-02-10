import { IsString, IsUUID, IsArray, ValidateNested, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    TRANSFER = 'TRANSFER',
    DEBIT = 'DEBIT',
}

export class CreateSaleItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    @Min(0.001)
    quantity: number;

    // Price is NO LONGER sent by client - fetched from DB for security
}

export class CreateSaleDto {
    @IsString()
    tenantId: string;

    @IsString()
    branchId: string;

    @IsString()
    @IsOptional()
    userId?: string;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleItemDto)
    items: CreateSaleItemDto[];
}
