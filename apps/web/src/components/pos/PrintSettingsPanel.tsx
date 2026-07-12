/**
 * PrintSettingsPanel
 *
 * Panel de configuración de impresión para el POS.
 * Muestra el estado de la conexión USB y configura el formato del ticket.
 */
import { Printer, Usb, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useWebSerialPrinter } from '@/hooks/useWebSerialPrinter';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Button } from '@/components/ui/button';

interface PrintSettingsPanelProps {
    /** Si true, se muestra como un panel compacto (para embeber en un modal) */
    compact?: boolean;
}

export function PrintSettingsPanel({ compact = false }: PrintSettingsPanelProps) {
    const { status, error, isConnected, connect, disconnect } = useWebSerialPrinter();

    const {
        autoPrint, setAutoPrint,
        defaultFormat, setDefaultFormat,
        useWebSerial, setUseWebSerial,
    } = usePrintSettings();

    const statusInfo = {
        connected: { label: 'Conectado (USB)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        connecting: { label: 'Conectando...', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
        unavailable: { label: 'No Soportado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        disconnected: { label: 'Desconectado', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', icon: <Usb className="w-3.5 h-3.5" /> },
        error: { label: 'Error USB', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    };

    const si = statusInfo[status];

    const handleConnectClick = async () => {
        const port = await connect();
        if (port) {
            setUseWebSerial(true);
        }
    };

    return (
        <div className={compact ? 'space-y-4' : 'space-y-5 p-4 rounded-xl border border-border bg-background'}>

            {/* ── Título ── */}
            {!compact && (
                <div className="flex items-center gap-2 pb-1 border-b border-border">
                    <Printer className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Configuración de Impresión</h3>
                </div>
            )}

            {/* ── Estado Web Serial ── */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impresora USB</span>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${si.bg} ${si.color}`}>
                        {si.icon}
                        {si.label}
                    </div>
                </div>

                {status === 'unavailable' && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                        <span>
                            Tu navegador no soporta Web Serial API. Para imprimir directamente, usa Google Chrome o Microsoft Edge.
                        </span>
                    </div>
                )}

                {error && status !== 'unavailable' && (
                    <p className="text-xs text-red-400">{error}</p>
                )}

                <div className="flex gap-2">
                    {!isConnected && status !== 'unavailable' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={handleConnectClick}
                            disabled={status === 'connecting'}
                        >
                            <Usb className="w-3 h-3" />
                            Vincular Impresora USB
                        </Button>
                    )}
                    {isConnected && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                            onClick={disconnect}
                        >
                            Desconectar
                        </Button>
                    )}
                </div>
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
                    label="Impresión Directa Silenciosa"
                    description="Si está desactivado, siempre mostrará el cuadro de diálogo del sistema (PDF/Iframe)"
                    value={useWebSerial}
                    onChange={setUseWebSerial}
                />
            </div>

            {/* ── Resumen del modo activo ── */}
            <div className={[
                'flex items-center gap-2 p-2.5 rounded-lg text-xs border',
                isConnected && useWebSerial
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    : 'bg-slate-500/5 border-slate-500/20 text-slate-400',
            ].join(' ')}>
                <Printer className="w-3.5 h-3.5 shrink-0" />
                {isConnected && useWebSerial
                    ? <span>✅ Impresión silenciosa USB activa</span>
                    : <span>⚠️ Modo diálogo — se mostrará el cuadro de impresión nativo</span>
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
