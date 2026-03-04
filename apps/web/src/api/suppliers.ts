import { apiClient } from './client';

export interface Supplier {
    id: string;
    name: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplierData {
    name: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export async function getSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get<Supplier[]>('/suppliers');
    return response.data;
}

export async function getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return response.data;
}

export async function createSupplier(data: CreateSupplierData): Promise<Supplier> {
    const response = await apiClient.post<Supplier>('/suppliers', data);
    return response.data;
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierData>): Promise<Supplier> {
    const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, data);
    return response.data;
}

export async function deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`);
}
