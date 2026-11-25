import { useEffect, useSyncExternalStore } from 'react';
import { localPrinter } from '@/utils/localPrinter';
import { useWebSerialPrinter } from './useWebSerialPrinter';
import { usePrintSettings } from './usePrintSettings';
let localPrinterStartup: Promise<boolean> | null = null;
export function useDirectPrinter() {
    const serial = useWebSerialPrinter();
    const local = useSyncExternalStore(localPrinter.subscribe, localPrinter.getSnapshot, localPrinter.getSnapshot);
    const { directConnection, setDirectConnection, setUseWebSerial, defaultFormat, setDefaultFormat } = usePrintSettings();
    useEffect(() => {
        const prefix = '#nexopos-printer=';
        if (!location.hash.startsWith(prefix)) return;
        const fragment = location.hash.slice(prefix.length);
        history.replaceState(history.state, '', location.pathname + location.search);
        try {
            const config = JSON.parse(decodeURIComponent(fragment));
            if (typeof config.token !== 'string' || !/^[a-f0-9]{64}$/.test(config.token) || typeof config.printer !== 'string' || !config.printer || config.printer.length > 256) return;
            setDirectConnection('local'); setUseWebSerial(true);
            if (defaultFormat === 'A4') setDefaultFormat('80mm');
            void localPrinter.pair(config).catch(() => undefined);
        } catch { /* Only an explicit local pairing is accepted. */ }
    }, [setDirectConnection, setUseWebSerial, defaultFormat, setDefaultFormat]);
    useEffect(() => {
        if (localPrinter.isPaired && directConnection !== 'local') return;
        if (!localPrinterStartup) {
            localPrinterStartup = localPrinter.initialize().then(discovered => {
                if (!discovered) return false;
                setDirectConnection('local'); setUseWebSerial(true);
                if (defaultFormat === 'A4') setDefaultFormat('80mm');
                return true;
            });
        }
    }, [directConnection, setDirectConnection, setUseWebSerial, defaultFormat, setDefaultFormat]);
    return directConnection === 'local'
        ? { ...local, connect: localPrinter.connect, cancelConnect: () => undefined, disconnect: localPrinter.disconnect, printBytes: localPrinter.printBytes, isConnected: local.status === 'connected', localError: local.error }
        : { ...serial, printers: [], printer: '', localError: local.error };
}
