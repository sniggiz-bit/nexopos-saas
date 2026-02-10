// Product types
export interface Product {
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
    stock: number; // Calculated from inventory
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductsResponse {
    data: Product[];
    total: number;
}

