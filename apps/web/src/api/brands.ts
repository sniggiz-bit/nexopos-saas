import { apiClient } from './client';

export interface Brand {
    id: string;
    name: string;
    productCount?: number;
    tenantId: string;
}

export interface CreateBrandData {
    name: string;
    tenantId: string;
}

export async function getBrands(tenantId: string = 'tenant-1'): Promise<Brand[]> {
    const response = await apiClient.get<Brand[]>('/brands', { params: { tenantId } });
    return response.data;
}

export async function createBrand(data: CreateBrandData): Promise<Brand> {
    const response = await apiClient.post<Brand>('/brands', data);
    return response.data;
}

export async function updateBrand(id: string, data: Partial<CreateBrandData>): Promise<Brand> {
    const response = await apiClient.patch<Brand>(`/brands/${id}`, data);
    return response.data;
}

export async function deleteBrand(id: string): Promise<void> {
    await apiClient.delete(`/brands/${id}`);
}
