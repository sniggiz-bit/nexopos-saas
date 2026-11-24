import { apiClient } from './client';
export interface DteConfig { id: string; tenantId: string; hasToken: boolean; liorenLogo: string | null; dteResolution: string | null; resolutionDate: string | null }
export interface UpsertDteConfigData { liorenToken?: string; liorenLogo?: string; dteResolution?: string; resolutionDate?: string }
export interface DteConnection {
  registeredRut: string | null; configured: boolean; connected: boolean; state: string; message: string; checkedAt: string;
  identityMatches: boolean; resolutionMatches: boolean; certificateValid: boolean;
  company: { name: string; rut: string; resolution: string | null; resolutionDate: string | null; validFrom: string | null; validTo: string | null } | null;
  types: Array<{ type: number; label: string; providerActive: boolean | null; available: number | null; nextFolio: number | null; localEnabled: boolean; ready: boolean }>;
}
export interface LocalDteRecords { confirmed: number; unverified: number; errors: number; pending: number; needsSupport: number; reviewDocs: Array<{ id: string; dteType: number; dteFolio: number; dteStatus: string }> }
export interface DteStats {
  connection: DteConnection;
  provider: { source: string; month: string; checkedAt: string; total: number | null; accepted: number | null; rejected: number | null; partial: boolean; types: Array<{ type: number; label: string; total: number | null; accepted: number | null; rejected: number | null; message: string }>; recent: Array<{ type: number; label: string; folio: number; date: string; total: number | null; state: string }> };
  local: LocalDteRecords;
}
export async function getDteConfig(_tenantId: string): Promise<DteConfig | null> { return (await apiClient.get('/dte-config')).data || null; }
export async function disconnectLioren(): Promise<DteConfig | null> { return (await apiClient.delete('/dte-config/token')).data || null; }
export async function getSalesMode(): Promise<{ mode: 'internal' | 'fiscal' }> { return (await apiClient.get('/dte-config/sales-mode')).data; }
export async function upsertDteConfig(data: UpsertDteConfigData): Promise<DteConfig> { return (await apiClient.post('/dte-config', data)).data; }
export async function getDteStats(fresh = false): Promise<DteStats> { return (await apiClient.get('/dte-config/stats', { params: fresh ? { refresh: '1' } : {}, timeout: 60000 })).data; }
export async function openDtePdf(path: string, format?: '58mm' | '80mm' | 'A4') {
  if (!/^\/(sales\/[a-zA-Z0-9-]+\/dte\/pdf|dte-config\/documents\/\d+\/\d+\/pdf)$/.test(path)) throw Error('Ruta de documento no válida.');
  return openAuthenticatedPdf(path + (format ? '?format=' + encodeURIComponent(format) : ''), 'documento-tributario.pdf');
}
export async function openInternalReceiptPdf(saleId: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(saleId)) throw Error('Identificador de comprobante no válido.');
  return openAuthenticatedPdf('/receipts/' + saleId, 'comprobante-interno.pdf');
}
async function openAuthenticatedPdf(path: string, filename: string) {
  const preview = window.open('', '_blank'); if (preview) preview.opener = null;
  try {
    const response = await apiClient.get(path, { responseType: 'blob', timeout: 20000 });
    if (String(response.headers['content-type']).split(';')[0].trim().toLowerCase() !== 'application/pdf') throw Error('No se recibió un documento PDF válido.');
    const url = URL.createObjectURL(response.data);
    if (preview) preview.location.href = url;
    else { const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); }
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) { preview?.close(); throw error; }
}
