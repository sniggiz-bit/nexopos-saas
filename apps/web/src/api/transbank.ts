import { apiClient } from './client';

export interface RecordTransactionPayload {
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

export async function recordTransaction(payload: RecordTransactionPayload) {
  const { data } = await apiClient.post('/transbank/record', payload);
  return data;
}

export async function linkTransactionToSale(orderId: string, saleId: string) {
  const { data } = await apiClient.post('/transbank/link-sale', { orderId, saleId });
  return data;
}

export async function getTransactionByOrderId(orderId: string) {
  const { data } = await apiClient.get(`/transbank/order/${orderId}`);
  return data;
}
