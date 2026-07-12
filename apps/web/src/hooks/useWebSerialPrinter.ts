import { useState, useRef, useCallback } from 'react';

// Declaración global para la API de Serial nativa (ya que TypeScript no siempre la incluye por defecto)
declare global {
    interface Navigator {
        serial?: any;
    }
}

export interface WebSerialState {
    status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable';
    error: string | null;
}

export function useWebSerialPrinter() {
    const [state, setState] = useState<WebSerialState>({
        status: navigator.serial ? 'disconnected' : 'unavailable',
        error: null,
    });
    
    // Referencia al puerto USB activo
    const portRef = useRef<any>(null);

    const connect = useCallback(async () => {
        if (!navigator.serial) {
            setState({ status: 'unavailable', error: 'Tu navegador no soporta Web Serial API (Usa Chrome o Edge)' });
            return null;
        }

        try {
            setState({ status: 'connecting', error: null });
            
            // Solicita al usuario seleccionar un puerto USB/Serial
            const port = await navigator.serial.requestPort();
            
            // Configuración estándar para la mayoría de impresoras térmicas ESC/POS
            await port.open({ baudRate: 9600 });
            
            portRef.current = port;
            setState({ status: 'connected', error: null });
            
            // Manejar cuando se desconecta físicamente el dispositivo
            navigator.serial.addEventListener('disconnect', (event: any) => {
                if (event.target === portRef.current) {
                    setState({ status: 'disconnected', error: 'Impresora desconectada' });
                    portRef.current = null;
                }
            });

            return port;
        } catch (err: any) {
            console.error('[WebSerial] Connection error:', err);
            setState({ status: 'error', error: err.message || 'Error al conectar' });
            return null;
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (portRef.current) {
            try {
                await portRef.current.close();
            } catch (err) {
                console.error('Error closing port:', err);
            }
            portRef.current = null;
            setState({ status: 'disconnected', error: null });
        }
    }, []);

    const printBytes = useCallback(async (data: Uint8Array): Promise<boolean> => {
        if (!portRef.current) {
            console.warn('[WebSerial] No hay puerto conectado, no se puede imprimir.');
            return false;
        }

        try {
            const writer = portRef.current.writable.getWriter();
            await writer.write(data);
            writer.releaseLock();
            return true;
        } catch (err: any) {
            console.error('[WebSerial] Print error:', err);
            setState({ status: 'error', error: 'Error al enviar datos a la impresora' });
            return false;
        }
    }, []);

    return {
        ...state,
        connect,
        disconnect,
        printBytes,
        isConnected: state.status === 'connected',
    };
}
