import { PriceTierDto } from './price-tier.dto';
export declare enum UnitType {
    UNIT = "UNIT",
    WEIGHT = "WEIGHT"
}
export declare class CreateProductDto {
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    costPrice?: number;
    minStock?: number;
    unitType?: UnitType;
    categoryId?: string;
    brandId?: string;
    image?: string;
    isActive?: boolean;
    initialStock?: number;
    priceTiers?: PriceTierDto[];
    tenantId: string;
    branchId?: string;
}
