import { useState } from 'react';
import { generatePrinterTest } from './receipts/ReceiptToEscPos';
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
    const { status, error, isConnected, isPrinting, connect, disconnect, printBytes } = useWebSerialPrinter();

    const {
        autoPrint, setAutoPrint,
        defaultFormat, setDefaultFormat,
        useWebSerial, setUseWebSerial,
        serialBaudRate, setSerialBaudRate, columns80, setColumns80, cutPaper, setCutPaper,
    } = usePrintSettings();

    const [testResult, setTestResult] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);
    const statusInfo = {
        connected: { label: 'Conectado (serial)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        connecting: { label: 'Conectando...', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
        unavailable: { label: 'No Soportado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        disconnected: { label: 'Desconectado', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', icon: <Usb className="w-3.5 h-3.5" /> },
        error: { label: 'Error de conexión', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    };

    const si = statusInfo[status];

    const handleConnectClick = async () => {
        const port = await connect(serialBaudRate);
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
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impresora serial / USB-COM</span>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${si.bg} ${si.color}`}>
                        {si.icon}
                        {si.label}
                    </div>
                </div>

                {status === 'unavailable' && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                        <span>
                            La conexión serial requiere Chrome o Edge. Puedes usar el diálogo de impresión para las impresoras instaladas en Windows.
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
                            disabled={status === 'connecting' || isPrinting}
                        >
                            <Usb className="w-3 h-3" />
                            Conectar impresora serial
                        </Button>
                    )}
                    {isConnected && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                            onClick={disconnect}
                            disabled={isPrinting}
                        >
                            Desconectar
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                La impresión directa requiere ESC/POS y un puerto serial/COM. Una conexión USB o Bluetooth solo sirve aquí si expone ese puerto. Para impresoras de red, Bluetooth BLE o USB instaladas únicamente con su controlador, usa el diálogo del sistema.
            </p>
            <label className="block text-xs space-y-1">
                <span>Velocidad serial (según la impresora)</span>
                <select aria-label="Velocidad serial" value={serialBaudRate} onChange={e => setSerialBaudRate(Number(e.target.value))} disabled={isConnected || status === 'connecting'} className="w-full rounded border bg-background p-2">
                    {[9600, 19200, 38400, 57600, 115200].map(rate => <option key={rate} value={rate}>{rate} baudios</option>)}
                </select>
            </label>
            {defaultFormat === '80mm' && <label className="block text-xs space-y-1">
                <span>Ancho de texto en 80 mm</span>
                <select aria-label="Columnas para 80 mm" value={columns80} onChange={e => setColumns80(Number(e.target.value) as 42 | 48)} className="w-full rounded border bg-background p-2">
                    <option value={48}>48 columnas</option><option value={42}>42 columnas (ancho reducido)</option>
                </select>
            </label>}
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
                    description="Envío ESC/POS por el puerto conectado. Las boletas con timbre se abren desde su PDF."
                    value={useWebSerial}
                    onChange={setUseWebSerial}
                />
                <ToggleRow label="Corte automático de papel" description="Desactívalo si tu impresora no tiene cortador" value={cutPaper} onChange={setCutPaper} />
            </div>

            <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" disabled={!isConnected || isPrinting || testing || defaultFormat === 'A4'} onClick={async () => {
                    if (defaultFormat === 'A4') return;
                    setTesting(true); setTestResult(null);
                    try {
                        const sent = await printBytes(generatePrinterTest(defaultFormat, { columns80, cutPaper }));
                        setTestResult(sent ? 'Prueba enviada al puerto. Comprueba el texto y el ancho en el papel.' : 'Conecta la impresora para enviar la prueba.');
                    } catch (error) { setTestResult(error instanceof Error ? error.message : 'No se pudo enviar la prueba.'); }
                    finally { setTesting(false); }
                }}>{testing ? 'Enviando prueba...' : 'Imprimir prueba sin venta'}</Button>
                {testResult && <p role="status" className="text-xs text-muted-foreground">{testResult}</p>}
                {defaultFormat === 'A4' && <p className="text-xs text-muted-foreground">A4 utiliza el diálogo del sistema.</p>}
            </div>
            {/* ── Resumen del modo activo ── */}
            <div className={[
                'flex items-center gap-2 p-2.5 rounded-lg text-xs border',
                (isConnected && useWebSerial && defaultFormat !== 'A4')
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    : 'bg-slate-500/5 border-slate-500/20 text-slate-400',
            ].join(' ')}>
                <Printer className="w-3.5 h-3.5 shrink-0" />
                {(isConnected && useWebSerial && defaultFormat !== 'A4')
                    ? <span>Impresión directa de comprobantes internos activa</span>
                    : <span>Modo diálogo: impresión mediante el sistema</span>
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
                type="button"
                role="switch"
                aria-label={label}
                aria-checked={value}
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
