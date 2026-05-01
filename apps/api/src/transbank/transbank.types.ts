// Respuesta normalizada del POS Transbank
export interface TransbankPosResponse {
  responseCode: number;         // 0 = aprobado
  authorizationCode: string;
  responseMessage: string;
  success: boolean;
  amount: number;
  cardType: string;             // 'CR' | 'DB'
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
  orderId: string;              // idempotency key — UUID generado en frontend
  amount: number;
  transbankResponse: TransbankPosResponse;
}

export interface PaymentProviderStatus {
  connected: boolean;
  agentVersion?: string;
  port?: string;
  terminalId?: string;
}
