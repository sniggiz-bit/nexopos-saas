// Product types
export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    sku?: string;
    imageUrl?: string;
    categoryId?: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductsResponse {
    data: Product[];
    total: number;
}
