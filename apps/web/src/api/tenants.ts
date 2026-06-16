import { api } from './client';

export interface TenantBillingInfo {
  name: string;
  phone?: string;
  rut?: string;
  giro?: string;
  address?: string;
}

export const updateTenantBillingInfo = async (id: string, data: TenantBillingInfo): Promise<any> => {
  const response = await api.patch(`/tenants/${id}/billing`, data);
  return response.data;
};

export const getTenantInfo = async (id: string): Promise<any> => {
  const response = await api.get(`/tenants/${id}`);
  return response.data;
};
