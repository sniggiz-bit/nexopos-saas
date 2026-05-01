import { apiClient } from './client';

export interface DteConfig {
    id: string;
    tenantId: string;
    liorenToken?: string | null;
    liorenLogo?: string | null;
    dteResolution?: string | null;
    resolutionDate?: string | null;
}

export interface UpsertDteConfigData {
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: string;
}

export async function getDteConfig(tenantId: string): Promise<DteConfig | null> {
    try {
        const response = await apiClient.get<DteConfig>('/dte-config', { params: { tenantId } });
        return response.data;
    } catch {
        return null;
    }
}

export async function upsertDteConfig(data: UpsertDteConfigData): Promise<DteConfig> {
    const response = await apiClient.post<DteConfig>('/dte-config', data);
    return response.data;
}
