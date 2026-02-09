export declare enum PaymentMethod {
    CASH = "CASH",
    CARD = "CARD",
    TRANSFER = "TRANSFER",
    DEBIT = "DEBIT"
}
export declare class CreateSaleItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateSaleDto {
    tenantId: string;
    branchId: string;
    userId?: string;
    paymentMethod: PaymentMethod;
    items: CreateSaleItemDto[];
}
