
import { IsString, IsOptional, IsNumber, IsDateString, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateQuoteItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsNumber()
    @Min(0)
    price: number;
}

export class CreateQuoteDto {
    @IsString()
    tenantId: string;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsDateString()
    expiryDate?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuoteItemDto)
    items: CreateQuoteItemDto[];
}
