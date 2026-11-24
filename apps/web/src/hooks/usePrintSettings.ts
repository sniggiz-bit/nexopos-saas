import { useMemo, useSyncExternalStore } from 'react';
export type PrintFormat = '80mm' | '58mm' | 'A4';
interface PrintSettings {
    autoPrint: boolean; defaultFormat: PrintFormat; useWebSerial: boolean;
    serialBaudRate: number; columns80: 42 | 48; cutPaper: boolean;
}
const key = 'nexopos_print_settings';
const event = 'nexopos:print-settings';
let fallback = '';
const getSnapshot = () => { try { return localStorage.getItem(key) || ''; } catch { return fallback; } };
function readSettings(raw: string): PrintSettings {
    let saved: any = {}; try { saved = JSON.parse(raw) || {}; } catch { /* Use defaults for invalid storage. */ }
    const format: PrintFormat = ['80mm', '58mm', 'A4'].includes(saved.defaultFormat) ? saved.defaultFormat : '80mm';
    return {
        autoPrint: saved.autoPrint === true || (saved.useWebSerial === true && format !== 'A4'), useWebSerial: saved.useWebSerial === true,
        defaultFormat: format,
        serialBaudRate: [9600, 19200, 38400, 57600, 115200].includes(saved.serialBaudRate) ? saved.serialBaudRate : 9600,
        columns80: saved.columns80 === 42 ? 42 : 48, cutPaper: saved.cutPaper !== false,
    };
}
const subscribe = (listener: () => void) => {
    const onStorage = (e: StorageEvent) => { if (e.key === key || e.key === null) listener(); };
    window.addEventListener('storage', onStorage); window.addEventListener(event, listener);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(event, listener); };
};
function update(patch: Partial<PrintSettings>) {
    fallback = JSON.stringify({ ...readSettings(getSnapshot()), ...patch });
    try { localStorage.setItem(key, fallback); } catch { /* Keep settings for this session. */ }
    window.dispatchEvent(new Event(event));
}
export function usePrintSettings() {
    const raw = useSyncExternalStore(subscribe, getSnapshot, () => '');
    const settings = useMemo(() => readSettings(raw), [raw]);
    return { ...settings,
        setAutoPrint: (autoPrint: boolean) => update({ autoPrint }),
        setDefaultFormat: (defaultFormat: PrintFormat) => update({ defaultFormat }),
        setUseWebSerial: (useWebSerial: boolean) => update({ useWebSerial, ...(useWebSerial ? { autoPrint: true } : {}) }),
        setSerialBaudRate: (serialBaudRate: number) => update({ serialBaudRate }),
        setColumns80: (columns80: 42 | 48) => update({ columns80 }),
        setCutPaper: (cutPaper: boolean) => update({ cutPaper }),
    };
}
