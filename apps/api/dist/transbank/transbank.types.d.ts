export interface TransbankPosResponse {
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
}
export interface RecordTransactionDto {
    tenantId: string;
    branchId: string;
    saleId?: string;
    orderId: string;
    amount: number;
    transbankResponse: TransbankPosResponse;
}
export interface PaymentProviderStatus {
    connected: boolean;
    agentVersion?: string;
    port?: string;
    terminalId?: string;
}
export interface TransbankBranchSettings {
    comPort: string;
    baudRate: number;
    mockMode: boolean;
    agentPort: number;
}
export declare function defaultTransbankSettings(): TransbankBranchSettings;
