declare class CreateQuoteItemDto {
    productId: string;
    productName?: string;
    quantity: number;
    price: number;
    discount?: number;
}
export declare class CreateQuoteDto {
    tenantId: string;
    customerId?: string;
    userId?: string;
    issueDate?: string;
    validUntil?: string;
    notes?: string;
    items: CreateQuoteItemDto[];
}
export {};
