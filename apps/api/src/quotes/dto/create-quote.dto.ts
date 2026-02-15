
import { IsString, IsOptional, IsNumber, IsDateString, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateQuoteItemDto {
    @IsString()
    productId: string;

    @IsOptional()
    @IsString()
    productName?: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    discount?: number;
}

export class CreateQuoteDto {
    @IsString()
    tenantId: string;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsDateString()
    issueDate?: string;

    @IsOptional()
    @IsDateString()
    validUntil?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuoteItemDto)
    items: CreateQuoteItemDto[];
}
