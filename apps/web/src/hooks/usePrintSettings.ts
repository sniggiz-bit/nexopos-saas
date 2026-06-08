import { useState, useEffect } from 'react';

export type PrintFormat = '80mm' | '58mm' | 'A4';

interface PrintSettings {
    autoPrint: boolean;
    defaultFormat: PrintFormat;
    /** Nombre de la impresora seleccionada en QZ Tray (vacío = usar impresora por defecto del sistema) */
    printerName: string;
    /** Si true, usar QZ Tray cuando esté disponible; si false, siempre usar el diálogo del navegador */
    useQzTray: boolean;
}

const STORAGE_KEY = 'print_settings_v2';

export function usePrintSettings() {
    const [settings, setSettings] = useState<PrintSettings>(() => {
        // Migrar desde la clave antigua si existe
        const oldSaved = localStorage.getItem('print_settings');
        const newSaved = localStorage.getItem(STORAGE_KEY);
        const source = newSaved ?? oldSaved;

        if (source) {
            try {
                const parsed = JSON.parse(source);
                return {
                    autoPrint: parsed.autoPrint ?? true,
                    defaultFormat: parsed.defaultFormat ?? '80mm',
                    printerName: parsed.printerName ?? '',
                    useQzTray: parsed.useQzTray ?? true,
                };
            } catch (e) {
                console.error('Error parsing print settings', e);
            }
        }
        return {
            autoPrint: true,
            defaultFormat: '80mm',
            printerName: '',
            useQzTray: true,
        };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const setAutoPrint = (autoPrint: boolean) =>
        setSettings(prev => ({ ...prev, autoPrint }));

    const setDefaultFormat = (defaultFormat: PrintFormat) =>
        setSettings(prev => ({ ...prev, defaultFormat }));

    const setPrinterName = (printerName: string) =>
        setSettings(prev => ({ ...prev, printerName }));

    const setUseQzTray = (useQzTray: boolean) =>
        setSettings(prev => ({ ...prev, useQzTray }));

    return {
        ...settings,
        setAutoPrint,
        setDefaultFormat,
        setPrinterName,
        setUseQzTray,
    };
}

