/**
 * useQzTray
 *
 * Hook para gestionar la conexión con el agente QZ Tray que permite
 * impresión silenciosa directa a impresoras físicas sin diálogo del SO.
 *
 * QZ Tray es un agente Java que corre en el PC del cajero en el puerto
 * localhost:8282 y expone una API WebSocket.
 *
 * Descarga: https://qz.io/download
 */
import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        qz?: any;
    }
}

export type QzStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable';

export interface QzTrayState {
    status: QzStatus;
    printers: string[];
    isConnected: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    getPrinters: () => Promise<string[]>;
    printHtml: (html: string, printerName: string, pageSize?: string) => Promise<void>;
}

const QZ_SCRIPT_ID = 'qz-tray-script';
const QZ_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';

/** Carga el script de QZ Tray dinámicamente si no está ya cargado */
function loadQzScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.qz) { resolve(); return; }
        if (document.getElementById(QZ_SCRIPT_ID)) {
            // Script ya añadido, esperar a que cargue
            const check = setInterval(() => {
                if (window.qz) { clearInterval(check); resolve(); }
            }, 100);
            setTimeout(() => { clearInterval(check); reject(new Error('QZ script load timeout')); }, 8000);
            return;
        }

        const script = document.createElement('script');
        script.id = QZ_SCRIPT_ID;
        script.src = QZ_SCRIPT_URL;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar el script de QZ Tray'));
        document.head.appendChild(script);
    });
}

export function useQzTray(): QzTrayState {
    const [status, setStatus] = useState<QzStatus>('disconnected');
    const [printers, setPrinters] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        };
    }, []);

    const connect = useCallback(async () => {
        if (!mountedRef.current) return;
        setStatus('connecting');
        setError(null);

        try {
            await loadQzScript();
        } catch {
            if (mountedRef.current) {
                setStatus('unavailable');
                setError('No se pudo cargar la librería QZ Tray');
            }
            return;
        }

        const qz = window.qz;
        if (!qz) { setStatus('unavailable'); return; }

        if (qz.websocket.isActive()) {
            if (mountedRef.current) {
                setStatus('connected');
                const printerList = await qz.printers.find().catch(() => []);
                setPrinters(printerList ?? []);
            }
            return;
        }

        // Configurar certificado y firma (sin certificado para modo dev)
        qz.security.setCertificatePromise((resolve: (val: any) => void) => {
            resolve(null); // Sin certificado en modo dev
        });
        qz.security.setSignatureAlgorithm('SHA512');
        qz.security.setSignaturePromise((_toSign: string) => {
            return (resolve: (val: any) => void) => {
                resolve(null); // Sin firma en modo dev
            };
        });

        // Handlers de conexión
        qz.websocket.setClosedCallbacks(() => {
            if (mountedRef.current) {
                setStatus('disconnected');
                // Reintentar conexión automáticamente después de 5s
                reconnectTimer.current = setTimeout(() => {
                    if (mountedRef.current) connect();
                }, 5000);
            }
        });

        qz.websocket.setErrorCallbacks((err: Error) => {
            if (mountedRef.current) {
                setError(err?.message ?? 'Error de conexión QZ Tray');
                setStatus('error');
            }
        });

        try {
            await qz.websocket.connect({ retries: 2, delay: 1 });
            if (!mountedRef.current) return;
            setStatus('connected');

            // Cargar lista de impresoras
            const printerList: string[] = await qz.printers.find();
            if (mountedRef.current) setPrinters(printerList ?? []);
        } catch (err: unknown) {
            if (!mountedRef.current) return;
            const msg = err instanceof Error ? err.message : 'QZ Tray no está disponible';
            if (msg.includes('Unable to establish') || msg.includes('ECONNREFUSED') || msg.includes('WebSocket')) {
                setStatus('unavailable');
                setError('QZ Tray no está instalado o no está ejecutándose');
            } else {
                setStatus('error');
                setError(msg);
            }
        }
    }, []);

    const disconnect = useCallback(async () => {
        const qz = window.qz;
        if (!qz || !qz.websocket.isActive()) return;
        try {
            await qz.websocket.disconnect();
        } catch { /* ignore */ }
        if (mountedRef.current) setStatus('disconnected');
    }, []);

    const getPrinters = useCallback(async (): Promise<string[]> => {
        const qz = window.qz;
        if (!qz || !qz.websocket.isActive()) {
            console.warn('[QZ Tray] getPrinters: No está activo o conectado.');
            return [];
        }
        try {
            const list: string[] = await qz.printers.find();
            console.log('[QZ Tray] Impresoras detectadas:', list);
            if (mountedRef.current) setPrinters(list ?? []);
            return list ?? [];
        } catch (err) {
            console.error('[QZ Tray] Error obteniendo impresoras:', err);
            return [];
        }
    }, []);

    /**
     * Imprime HTML directamente en la impresora indicada.
     * Usa el renderer HTML de QZ Tray que soporta CSS básico y @page size.
     */
    const printHtml = useCallback(async (
        html: string,
        printerName: string,
        pageSize: string = '80mm',
    ): Promise<void> => {
        const qz = window.qz;
        if (!qz || !qz.websocket.isActive()) {
            throw new Error('QZ Tray no está conectado');
        }

        // Convertir pageSize (80mm / 58mm) a formato QZ
        const widthMm = pageSize === '58mm' ? 58 : 80;

        const config = qz.configs.create(printerName, {
            size: { width: widthMm, height: null }, // height null = continuo (auto-cut)
            units: 'mm',
            colorType: 'blackwhite',
            copies: 1,
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        // Añadir estilos de impresión al HTML
        const printHtml = html.includes('</head>')
            ? html.replace('</head>', `
                <style>
                    @media print {
                        @page { size: ${widthMm}mm auto; margin: 0; }
                        body { margin: 0; padding: 0; }
                    }
                </style>
            </head>`)
            : `<!DOCTYPE html><html><head>
                <meta charset="utf-8">
                <style>
                    @media print { @page { size: ${widthMm}mm auto; margin: 0; } body { margin: 0; padding: 0; } }
                    body { font-family: Arial, sans-serif; font-size: 11px; }
                </style>
            </head><body>${html}</body></html>`;

        const data = [{
            type: 'pixel',
            format: 'html',
            flavor: 'plain',
            data: printHtml,
        }];

        await qz.print(config, data);
    }, []);

    // Intentar conexión automática al montar
    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        status,
        printers,
        isConnected: status === 'connected',
        error,
        connect,
        disconnect,
        getPrinters,
        printHtml,
    };
}
