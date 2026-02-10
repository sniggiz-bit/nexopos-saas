/**
 * Response DTO for Product endpoints
 * Includes calculated stock from InventoryLevel and all product details
 */
export class ProductResponseDto {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    costPrice: number;
    minStock: number;
    unitType: 'UNIT' | 'WEIGHT';
    image?: string;
    isActive: boolean;
    stock: number; // Calculated from InventoryLevel
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
}

