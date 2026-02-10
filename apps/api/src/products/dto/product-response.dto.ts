/**
 * Response DTO for Product endpoints
 * Includes calculated stock from InventoryLevel
 */
export class ProductResponseDto {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku?: string;
}
