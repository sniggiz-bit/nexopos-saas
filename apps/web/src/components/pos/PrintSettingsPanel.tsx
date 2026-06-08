/**
 * PrintSettingsPanel
 *
 * Panel de configuración de impresión para el POS.
 * Muestra el estado de QZ Tray, permite seleccionar impresora
 * y configurar el formato del ticket.
 */
import { Printer, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { useQzTray } from '@/hooks/useQzTray';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Button } from '@/components/ui/button';

interface PrintSettingsPanelProps {
    /** Si true, se muestra como un panel compacto (para embeber en un modal) */
    compact?: boolean;
}

export function PrintSettingsPanel({ compact = false }: PrintSettingsPanelProps) {
    const {
        status, printers, isConnected, error,
        connect, getPrinters,
    } = useQzTray();

    const {
        autoPrint, setAutoPrint,
        defaultFormat, setDefaultFormat,
        printerName, setPrinterName,
        useQzTray: useQzEnabled, setUseQzTray,
    } = usePrintSettings();

    const statusInfo = {
        connected: { label: 'Conectado', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        connecting: { label: 'Conectando...', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
        unavailable: { label: 'No instalado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <WifiOff className="w-3.5 h-3.5" /> },
        disconnected: { label: 'Desconectado', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', icon: <WifiOff className="w-3.5 h-3.5" /> },
        error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    };

    const si = statusInfo[status];

    return (
        <div className={compact ? 'space-y-4' : 'space-y-5 p-4 rounded-xl border border-border bg-background'}>

            {/* ── Título ── */}
            {!compact && (
                <div className="flex items-center gap-2 pb-1 border-b border-border">
                    <Printer className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Configuración de Impresión</h3>
                </div>
            )}

            {/* ── Estado QZ Tray ── */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QZ Tray</span>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${si.bg} ${si.color}`}>
                        {si.icon}
                        {si.label}
                    </div>
                </div>

                {status === 'unavailable' && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                        <span>
                            QZ Tray no está instalado o no está ejecutándose.{' '}
                            <a
                                href="https://qz.io/download"
                                target="_blank"
                                rel="noreferrer"
                                className="underline font-semibold text-amber-400 hover:text-amber-300"
                            >
                                Descargar aquí
                            </a>
                        </span>
                    </div>
                )}

                {error && status !== 'unavailable' && (
                    <p className="text-xs text-red-400">{error}</p>
                )}

                <div className="flex gap-2">
                    {!isConnected && status !== 'connecting' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={connect}
                        >
                            <Wifi className="w-3 h-3" />
                            Conectar QZ Tray
                        </Button>
                    )}
                    {isConnected && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={getPrinters}
                        >
                            <RefreshCw className="w-3 h-3" />
                            Actualizar impresoras
                        </Button>
                    )}
                    {status === 'unavailable' && (
                        <a
                            href="https://qz.io/download"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                <Download className="w-3 h-3" />
                                Descargar QZ Tray
                            </Button>
                        </a>
                    )}
                </div>
            </div>

            {/* ── Selección de impresora ── */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Impresora
                </label>
                <select
                    value={printerName}
                    onChange={e => setPrinterName(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                    disabled={!isConnected}
                >
                    <option value="">
                        {isConnected
                            ? printers.length > 0
                                ? '— Seleccionar impresora —'
                                : 'No hay impresoras disponibles'
                            : 'Conecta QZ Tray para ver impresoras'}
                    </option>
                    {printers.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                {printerName && (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Impresora seleccionada: <span className="font-medium">{printerName}</span>
                    </p>
                )}
                {isConnected && !printerName && (
                    <p className="text-[10px] text-amber-400">
                        Selecciona una impresora para activar la impresión silenciosa
                    </p>
                )}
            </div>

            {/* ── Formato del ticket ── */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Formato de ticket
                </label>
                <div className="flex gap-1.5">
                    {(['80mm', '58mm', 'A4'] as const).map(fmt => (
                        <button
                            key={fmt}
                            onClick={() => setDefaultFormat(fmt)}
                            className={[
                                'flex-1 h-8 text-xs font-medium rounded-lg border transition-all',
                                defaultFormat === fmt
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-muted border-border text-muted-foreground hover:text-foreground',
                            ].join(' ')}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Opciones ── */}
            <div className="space-y-2 pt-1 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Opciones
                </label>

                <ToggleRow
                    label="Auto-imprimir al vender"
                    description="Imprime el ticket automáticamente al completar la venta"
                    value={autoPrint}
                    onChange={setAutoPrint}
                />

                <ToggleRow
                    label="Usar QZ Tray (silencioso)"
                    description="Si está desactivado, siempre usará el diálogo del navegador"
                    value={useQzEnabled}
                    onChange={setUseQzTray}
                />
            </div>

            {/* ── Resumen del modo activo ── */}
            <div className={[
                'flex items-center gap-2 p-2.5 rounded-lg text-xs border',
                isConnected && printerName && useQzEnabled
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    : 'bg-slate-500/5 border-slate-500/20 text-slate-400',
            ].join(' ')}>
                <Printer className="w-3.5 h-3.5 shrink-0" />
                {isConnected && printerName && useQzEnabled
                    ? <span>✅ Modo silencioso activo — sin diálogo del SO</span>
                    : <span>⚠️ Modo diálogo — el cajero verá el cuadro de impresión</span>
                }
            </div>
        </div>
    );
}

function ToggleRow({
    label, description, value, onChange,
}: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={[
                    'shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    value ? 'bg-primary' : 'bg-muted-foreground/30',
                ].join(' ')}
            >
                <span
                    className={[
                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                        value ? 'translate-x-4' : 'translate-x-0.5',
                    ].join(' ')}
                />
            </button>
        </div>
    );
}
