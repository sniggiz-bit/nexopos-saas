export declare class ProductResponseDto {
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
    stock: number;
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
}
