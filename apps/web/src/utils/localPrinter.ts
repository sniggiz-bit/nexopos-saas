import type { WebSerialState } from './serialPrinter';
const base = 'https://localhost:18443';
const key = 'nexopos_local_printer';
function newJobId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
interface LocalConfig { token: string; printer: string }
export interface InstalledPrinter { name: string; port: string; offline: boolean }
export class LocalPrintError extends Error {}
export class LocalPrinter {
    private config: LocalConfig | null = null;
    private listeners = new Set<() => void>();
    private state: WebSerialState & { printers: InstalledPrinter[]; printer: string } = { status: 'disconnected', error: null, isPrinting: false, printers: [], printer: '' };
    constructor() { try { this.config = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* The user can pair again. */ } }
    getSnapshot = () => this.state;
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private update(patch: Partial<typeof this.state>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(listener => listener()); }
    private save() { try { localStorage.setItem(key, JSON.stringify(this.config)); } catch { /* Keep the pairing for this page. */ } }
    private async request(path: string, body?: unknown) {
        if (!this.config?.token) throw new LocalPrintError('Abre el conector local para vincular este navegador con la impresora.');
        const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 35000);
        try {
            const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + this.config.token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error' });
            const result = await response.json();
            if (!response.ok || result.ok !== true) throw new LocalPrintError(body ? 'No se confirmó el envío a Windows. Revisa el papel antes de reimprimir.' : 'No se pudo conectar. Abre el conector local y vuelve a vincular este navegador.');
            return result;
        } catch (error) {
            if (error instanceof LocalPrintError) throw error;
            throw new LocalPrintError(body ? 'No se confirmó el envío a Windows. Revisa el papel antes de reimprimir.' : 'No se pudo acceder al conector local. Ábrelo en este equipo y permite el acceso local si el navegador lo solicita.');
        } finally { clearTimeout(timer); }
    }
    pair = async (config: LocalConfig) => {
        if (!/^[a-f0-9]{64}$/.test(config.token) || typeof config.printer !== 'string' || !config.printer || config.printer.length > 256) throw new LocalPrintError('Vinculación local no válida.');
        this.config = config; this.save(); return this.connect();
    };
    connect = async () => {
        if (this.state.isPrinting || this.state.status === 'connecting') return;
        this.update({ status: 'connecting', error: null });
        try {
            const result = await this.request('/printers');
            if (!Array.isArray(result.printers) || !result.printers.every((p: InstalledPrinter) => typeof p.name === 'string' && typeof p.offline === 'boolean')) throw new LocalPrintError('El conector no informó las impresoras.');
            const printer = result.printers.find((p: InstalledPrinter) => p.name === this.config?.printer);
            this.update({ printers: result.printers, printer: printer?.name || '', status: printer && !printer.offline ? 'connected' : 'error', error: !printer ? 'Selecciona una impresora instalada en este equipo.' : printer.offline ? 'La impresora está sin conexión en Windows.' : null });
        } catch (error) { this.update({ status: 'error', error: error instanceof Error ? error.message : 'No se pudo conectar con la impresora local.' }); }
    };
    select = async (printer: string) => { if (this.config && !this.state.isPrinting) { this.config = { ...this.config, printer }; this.save(); await this.connect(); } };
    disconnect = async () => { if (!this.state.isPrinting) this.update({ status: 'disconnected', error: null }); };
    printBytes = async (bytes: Uint8Array): Promise<boolean> => {
        if (this.state.status !== 'connected' || this.state.isPrinting || !this.config?.printer) return false;
        this.update({ isPrinting: true, error: null });
        try {
            let binary = ''; for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
            await this.request('/jobs', { id: newJobId(), createdAt: Date.now(), printer: this.config.printer, data: btoa(binary) }); return true;
        } catch (error) { this.update({ status: 'error', error: error instanceof Error ? error.message : 'Impresión pendiente.' }); throw error; }
        finally { this.update({ isPrinting: false }); }
    };
}
export const localPrinter = new LocalPrinter();
export const localPrinterSetupUrl = base + '/';
