import { api } from './client';

export interface Invoice {
  id: string;
  tenantId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get('/billing/invoices');
  return response.data;
};

export const payInvoiceSimulate = async (id: string): Promise<any> => {
  const response = await api.post(`/billing/invoices/${id}/pay-simulate`);
  return response.data;
};
