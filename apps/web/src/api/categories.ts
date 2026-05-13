import { apiClient } from './client';

export interface Category {
    id: string;
    name: string;
    productCount?: number;
    tenantId?: string;
}

export interface CreateCategoryData {
    name: string;
}

export async function getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
}

export async function createCategory(data: CreateCategoryData): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
}

export async function updateCategory(id: string, data: Partial<CreateCategoryData>): Promise<Category> {
    const response = await apiClient.patch<Category>(`/categories/${id}`, data);
    return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
}
