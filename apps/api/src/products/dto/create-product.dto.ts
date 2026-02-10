import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';

export enum UnitType {
    UNIT = 'UNIT',
    WEIGHT = 'WEIGHT',
}

/**
 * DTO for creating a new product
 */
export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsInt()
    @Min(0)
    price: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    costPrice?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    minStock?: number;

    @IsOptional()
    @IsEnum(UnitType)
    unitType?: UnitType;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    brandId?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    initialStock?: number;

    @IsString()
    tenantId: string;
}
