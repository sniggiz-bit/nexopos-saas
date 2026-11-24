export interface PrinterPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    writable: { getWriter(): { write(data: Uint8Array): Promise<void>; releaseLock(): void } } | null;
}
export interface PrinterSerial {
    requestPort(): Promise<PrinterPort>;
    addEventListener(type: string, listener: (event: any) => void): void;
}
declare global { interface Navigator { serial?: PrinterSerial } }
export interface WebSerialState {
    status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable';
    error: string | null;
    isPrinting: boolean;
}
export class DirectPrintWriteError extends Error {
    constructor() { super('Se interrumpió el envío a la impresora. Revisa el papel antes de volver a imprimir.'); }
}
/** One port for the entire page, including panels that mount and unmount. */
export class SerialPrinter {
    private api: () => PrinterSerial | undefined;
    private port: PrinterPort | null = null;
    private connectGeneration = 0;
    private pendingConnect: Promise<PrinterPort | null> | null = null;
    private queue: Promise<unknown> = Promise.resolve();
    private disconnecting = false;
    private listenedApi?: PrinterSerial;
    private listeners = new Set<() => void>();
    private state: WebSerialState;
    constructor(api: () => PrinterSerial | undefined) {
        this.api = api;
        this.state = { status: api() ? 'disconnected' : 'unavailable', error: null, isPrinting: false };
    }
    getSnapshot = () => this.state;
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private update(patch: Partial<WebSerialState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(listener => listener()); }
    private enqueue<T>(action: () => Promise<T>): Promise<T> {
        const job = this.queue.then(action, action);
        this.queue = job.catch(() => undefined);
        return job;
    }
    connect = (baudRate = 9600): Promise<PrinterPort | null> => {
        if (this.pendingConnect) return this.pendingConnect;
        if (this.port) return Promise.resolve(this.port);
        const api = this.api();
        if (!api) { this.update({ status: 'unavailable', error: 'Usa Chrome o Edge con una impresora que exponga un puerto serial / COM.' }); return Promise.resolve(null); }
        if (this.disconnecting || this.state.isPrinting || ![9600, 19200, 38400, 57600, 115200].includes(baudRate)) return Promise.resolve(null);
        if (this.listenedApi !== api) {
            api.addEventListener('disconnect', event => {
                if (this.port && (event.target === this.port || event.port === this.port)) {
                    this.port = null;
                    this.update({ status: 'disconnected', error: 'Impresora desconectada. Vuelve a conectarla para imprimir.' });
                }
            });
            this.listenedApi = api;
        }
        const generation = ++this.connectGeneration;
        this.update({ status: 'connecting', error: null });
        // requestPort runs directly inside the user's click gesture.
        const pending = (async () => {
            try {
                const port = await api.requestPort();
                if (generation !== this.connectGeneration) return null;
                const opening = port.open({ baudRate });
                let timer: ReturnType<typeof setTimeout> | undefined;
                try {
                    await Promise.race([opening, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Open timeout')), 10000); })]);
                } catch (error) {
                    void opening.then(() => this.port !== port ? port.close().catch(() => undefined) : undefined, () => undefined);
                    throw error;
                } finally { clearTimeout(timer); }
                if (generation !== this.connectGeneration) { if (this.port !== port) await port.close().catch(() => undefined); return null; }
                if (!port.writable) { await port.close(); throw new Error('Port not writable'); }
                this.port = port;
                this.update({ status: 'connected', error: null });
                return port;
            } catch (error) {
                if (generation !== this.connectGeneration) return null;
                const cancelled = error instanceof DOMException && error.name === 'NotFoundError';
                this.update({ status: cancelled ? 'disconnected' : 'error', error: cancelled ? null : 'No se pudo abrir el puerto. Revisa la conexión, la velocidad y si otra aplicación está usando la impresora.' });
                return null;
            }
        })();
        this.pendingConnect = pending;
        void pending.then(() => { if (this.pendingConnect === pending) this.pendingConnect = null; });
        return pending;
    };
    cancelConnect = () => {
        if (this.state.status !== 'connecting') return;
        this.connectGeneration++; this.pendingConnect = null;
        this.update({ status: 'disconnected', error: null });
    };
    disconnect = async () => {
        this.cancelConnect();
        this.disconnecting = true;
        try {
            await this.enqueue(async () => {
                const port = this.port; this.port = null;
                if (port) await port.close().catch(() => undefined);
                this.update({ status: this.api() ? 'disconnected' : 'unavailable', error: null });
            });
        } finally { this.disconnecting = false; }
    };
    printBytes = (data: Uint8Array): Promise<boolean> => {
        const bytes = data.slice();
        return this.enqueue(async () => {
            const port = this.port;
            if (!port?.writable || this.disconnecting) return false;
            this.update({ isPrinting: true, error: null });
            let writer: ReturnType<NonNullable<PrinterPort['writable']>['getWriter']> | undefined;
            let failed = false;
            try {
                writer = port.writable.getWriter();
                for (let offset = 0; offset < bytes.length; offset += 1024) await writer.write(bytes.slice(offset, offset + 1024));
            } catch { failed = true; }
            finally { writer?.releaseLock(); this.update({ isPrinting: false }); }
            if (failed) {
                if (this.port === port) this.port = null;
                await port.close().catch(() => undefined);
                const error = new DirectPrintWriteError();
                this.update({ status: 'error', error: error.message });
                throw error;
            }
            return true;
        });
    };
}
export const serialPrinter = new SerialPrinter(() => typeof navigator === 'undefined' ? undefined : navigator.serial);
