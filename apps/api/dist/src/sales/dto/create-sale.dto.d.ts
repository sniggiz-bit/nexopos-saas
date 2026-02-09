export declare class CreateSaleItemDto {
    productId: string;
    quantity: number;
    price: number;
}
export declare class CreateSaleDto {
    tenantId: string;
    branchId: string;
    userId?: string;
    items: CreateSaleItemDto[];
}
