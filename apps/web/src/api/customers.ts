
import { apiClient } from './client';
import type { Customer } from './types';

export interface CreateCustomerData {
    name: string;
    rut: string;
    giro?: string;
    address?: string;
    comuna?: string;
    email?: string;
    phone?: string;
    tenantId: string;
}

export async function getCustomers(tenantId: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>('/customers', { params: { tenantId } });
    return response.data;
}

export async function getCustomer(id: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
}

export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', data);
    return response.data;
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<Customer> {
    const response = await apiClient.patch<Customer>(`/customers/${id}`, data);
    return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
}
