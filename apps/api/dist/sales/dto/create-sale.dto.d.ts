export declare enum PaymentMethod {
    EFECTIVO = "EFECTIVO",
    DEBITO = "DEBITO",
    CREDITO = "CREDITO",
    TRANSFERENCIA = "TRANSFERENCIA"
}
export declare class CreatePaymentDto {
    paymentMethod: PaymentMethod;
    amount: number;
}
export declare class CreateSaleItemDto {
    productId: string;
    quantity: number;
    price?: number;
    discountAmount?: number;
}
export declare class CreateSaleDto {
    tenantId?: string;
    branchId?: string;
    userId?: string;
    payments: CreatePaymentDto[];
    items: CreateSaleItemDto[];
    status?: 'COMPLETED' | 'PRE_SALE';
    customerId?: string;
    quoteId?: string;
}
