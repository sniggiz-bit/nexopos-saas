import { useState, useEffect } from 'react';

export type PrintFormat = '80mm' | '58mm' | 'A4';

interface PrintSettings {
    autoPrint: boolean;
    defaultFormat: PrintFormat;
    useWebSerial: boolean;
}

export function usePrintSettings() {
    const [settings, setSettings] = useState<PrintSettings>(() => {
        const saved = localStorage.getItem('nexopos_print_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    autoPrint: !!parsed.autoPrint,
                    defaultFormat: (parsed.defaultFormat as PrintFormat) || '80mm',
                    useWebSerial: parsed.useWebSerial ?? false,
                };
            } catch (e) {
                console.error('Failed to parse print settings', e);
            }
        }
        return {
            autoPrint: false,
            defaultFormat: '80mm',
            useWebSerial: false,
        };
    });

    useEffect(() => {
        localStorage.setItem('nexopos_print_settings', JSON.stringify(settings));
    }, [settings]);

    const setAutoPrint = (autoPrint: boolean) =>
        setSettings(prev => ({ ...prev, autoPrint }));

    const setDefaultFormat = (defaultFormat: PrintFormat) =>
        setSettings(prev => ({ ...prev, defaultFormat }));

    const setUseWebSerial = (useWebSerial: boolean) =>
        setSettings(prev => ({ ...prev, useWebSerial }));

    return {
        ...settings,
        setAutoPrint,
        setDefaultFormat,
        setUseWebSerial,
    };
}
