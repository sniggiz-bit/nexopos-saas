import { Injectable } from '@nestjs/common';
import axios from 'axios';

export const DTE_TYPES = [39, 33, 61, 52] as const;
export const DTE_CODES: Record<number, string> = { 39: 'DTE_BOLETA', 33: 'DTE_FACTURA', 61: 'DTE_NOTA_CREDITO', 52: 'DTE_GUIA_DESPACHO' };
export const DTE_LABELS: Record<number, string> = { 39: 'Boleta electrónica', 33: 'Factura electrónica', 61: 'Nota de crédito', 52: 'Guía de despacho' };
export function normalizeRut(value: unknown): string { return String(value || '').replace(/[^0-9kK]/g, '').toUpperCase(); }
export function usableToken(value: unknown): value is string { return typeof value === 'string' && value.trim().length >= 16 && !/TEST_TOKEN|YOUR_TOKEN/.test(value); }
export function chileDate(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const get = (name: string) => parts.find(p => p.type === name)!.value;
  return get('year') + '-' + get('month') + '-' + get('day');
}
export function chileMonth(value = new Date()) {
  const day = chileDate(value); const year = Number(day.slice(0, 4)); const month = Number(day.slice(5, 7));
  return { from: day.slice(0, 8) + '01', to: day.slice(0, 8) + new Date(Date.UTC(year, month, 0)).getUTCDate(), label: day.slice(0, 7) };
}
export function siiStatus(value: unknown): string {
  return ({ acepta: 'ACEPTADO', reparo: 'REPARO', rechazo: 'RECHAZADO', pendiente: 'PENDIENTE_SII' } as Record<string, string>)[String(value || '').toLowerCase()] || 'EMITIDO';
}
export class LiorenApiError extends Error {
  constructor(public readonly status: number | null, public readonly uncertain = false) {
    super(status === 401 ? 'Lioren rechazó el token. Revisa la credencial.' : status === 403 || status === 426 ? 'Lioren no autoriza esta operación con el token o servicio actual.' : status === 429 ? 'Lioren limitó temporalmente las consultas. Intenta más tarde.' : uncertain ? 'No se pudo confirmar la respuesta de Lioren. No reenvíes el documento.' : 'No se pudo completar la consulta a Lioren.');
  }
}
@Injectable()
export class LiorenApiService {
  private readonly baseUrl = 'https://cl.lioren.enterprises/api/';
  private headers(token: string) { return { Accept: 'application/json', Authorization: 'Bearer ' + token }; }
  async get(token: string, endpoint: string, params?: Record<string, string | number>) {
    try { return (await axios.get(this.baseUrl + endpoint, { headers: this.headers(token), params, timeout: 8000, maxRedirects: 0 })).data; }
    catch (error: any) { throw new LiorenApiError(error.response?.status || null); }
  }
  async issue(token: string, type: number, payload: object, key: string) {
    try {
      return (await axios.post(this.baseUrl + (type === 39 ? 'boletas' : 'dtes'), payload, { headers: { ...this.headers(token), 'Content-Type': 'application/json', 'X-Idempotency-Check': key }, timeout: 20000, maxRedirects: 0 })).data;
    } catch (error: any) {
      const response = error.response;
      if (response?.status === 409 && Number(response.data?.original_status) >= 200 && Number(response.data?.original_status) < 300 && response.data.original_response) return response.data.original_response;
      throw new LiorenApiError(response?.status || null, !response || response.status >= 500 || response.status === 409);
    }
  }
  async company(token: string) {
    const data = await this.get(token, 'miempresa');
    if (!data || typeof data.rut !== 'string' || !normalizeRut(data.rut) || !data.rs) throw new LiorenApiError(null);
    return { rut: data.rut as string, name: String(data.rs), resolution: data.numeroresolucion == null ? null : String(data.numeroresolucion), resolutionDate: typeof data.fecharesolucion === 'string' ? data.fecharesolucion.slice(0, 10) : null, validFrom: typeof data.validfrom === 'string' ? data.validfrom : null, validTo: typeof data.validto === 'string' ? data.validto : null };
  }
  async types(token: string) {
    const response = await this.get(token, 'tipodocs');
    const list = Array.isArray(response) ? response : Array.isArray(response?.tipodocs) ? response.tipodocs : Array.isArray(response?.data) ? response.data : null;
    if (!list) throw new LiorenApiError(null);
    return DTE_TYPES.map(type => {
      const row = list.find((item: any) => Number(item.codigosii ?? item.tipodoc) === type);
      const count = row?.folios?.disponibles; const next = row?.folios?.siguiente;
      const nonnegative = (value: unknown) => value !== null && value !== undefined && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
      return { type, label: DTE_LABELS[type], providerActive: !!row, available: nonnegative(count), nextFolio: nonnegative(next) && Number(next) > 0 ? Number(next) : null };
    });
  }
  async index(token: string, type: number, params: Record<string, string | number>) {
    const data = await this.get(token, type === 39 ? 'boletas/index' : 'dtes/index', { tipodoc: type, ...params });
    if (!Array.isArray(data?.data) || !Number.isSafeInteger(Number(data.total)) || Number(data.total) < 0) throw new LiorenApiError(null);
    return { total: Number(data.total), rows: data.data };
  }
  async document(token: string, type: number, folio: number, pdf = false) {
    const data = await this.get(token, type === 39 ? 'boletas' : 'dtes', { tipodoc: type, folio, ...(pdf ? { expects: 'pdf' } : {}) });
    if (Number(data?.folio) !== folio || Number(data?.tipodoc) !== type || !data?.id) throw new LiorenApiError(null);
    return data;
  }
  pdfBuffer(value: unknown): Buffer {
    if (typeof value !== 'string' || value.length > 16 * 1024 * 1024 || !/^[A-Za-z0-9+/=\r\n]+$/.test(value)) throw new LiorenApiError(null);
    const buffer = Buffer.from(value, 'base64');
    if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new LiorenApiError(null);
    return buffer;
  }
}
