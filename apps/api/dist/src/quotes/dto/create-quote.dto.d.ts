declare class CreateQuoteItemDto {
    productId: string;
    quantity: number;
    price: number;
}
export declare class CreateQuoteDto {
    tenantId: string;
    customerId?: string;
    expiryDate?: string;
    items: CreateQuoteItemDto[];
}
export {};
