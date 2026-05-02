export declare class RecordTransactionDto {
    tenantId: string;
    branchId: string;
    saleId?: string;
    orderId: string;
    amount: number;
    transbankResponse: {
        responseCode: number;
        authorizationCode: string;
        responseMessage: string;
        success: boolean;
        amount: number;
        cardType: string;
        lastFourDigits: string;
        ticket: string;
        realDate: string;
        realTime: string;
        installments?: number;
        terminalId?: string;
    };
}
