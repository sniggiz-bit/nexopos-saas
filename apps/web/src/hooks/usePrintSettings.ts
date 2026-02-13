import { useState, useEffect } from 'react';

export type PrintFormat = '80mm' | '50mm' | 'A4';

interface PrintSettings {
    autoPrint: boolean;
    defaultFormat: PrintFormat;
}

export function usePrintSettings() {
    const [settings, setSettings] = useState<PrintSettings>(() => {
        const saved = localStorage.getItem('print_settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing print settings', e);
            }
        }
        return {
            autoPrint: true,
            defaultFormat: '80mm',
        };
    });

    useEffect(() => {
        localStorage.setItem('print_settings', JSON.stringify(settings));
    }, [settings]);

    const setAutoPrint = (autoPrint: boolean) => {
        setSettings(prev => ({ ...prev, autoPrint }));
    };

    const setDefaultFormat = (defaultFormat: PrintFormat) => {
        setSettings(prev => ({ ...prev, defaultFormat }));
    };

    return {
        ...settings,
        setAutoPrint,
        setDefaultFormat,
    };
}
