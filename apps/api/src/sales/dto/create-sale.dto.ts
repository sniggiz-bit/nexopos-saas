export class CreateSaleItemDto {
    productId: string;
    quantity: number;
    price: number;
}

export class CreateSaleDto {
    tenantId: string;
    branchId: string;
    userId?: string;
    items: CreateSaleItemDto[];
}
