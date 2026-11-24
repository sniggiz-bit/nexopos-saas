import { localPrinter, localPrinterSetupUrl } from '@/utils/localPrinter';
import { useId, useState } from 'react';
import { Printer, Usb, Monitor, CheckCircle2, AlertTriangle, RefreshCw, ChevronDown, X } from 'lucide-react';
import { useDirectPrinter } from '@/hooks/useDirectPrinter';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Button } from '@/components/ui/button';
import { printThroughIframe } from '@/utils/print';
import { printerTestHtml } from '@/utils/printerTest';
import { generatePrinterTest } from './receipts/ReceiptToEscPos';

interface PrintSettingsPanelProps { compact?: boolean; onClose?: () => void }
export function PrintSettingsPanel({ compact = false, onClose }: PrintSettingsPanelProps) {
    const { status, error, isConnected, isPrinting, connect, cancelConnect, disconnect, printBytes, printers, printer } = useDirectPrinter();
    const { autoPrint, setAutoPrint, defaultFormat, setDefaultFormat, useWebSerial, setUseWebSerial,
        serialBaudRate, setSerialBaudRate, columns80, setColumns80, cutPaper, setCutPaper, directConnection, setDirectConnection } = usePrintSettings();
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);
    const modeId = useId();
    const direct = useWebSerial && defaultFormat !== 'A4';
    const busy = isPrinting || testing || status === 'connecting';
    const statusInfo = {
        connected: { label: directConnection === 'local' ? 'Conectado (Windows)' : 'Conectado (serial)', icon: CheckCircle2, color: 'text-emerald-500' },
        connecting: { label: 'Conectando...', icon: RefreshCw, color: 'text-amber-500' },
        unavailable: { label: 'No disponible', icon: AlertTriangle, color: 'text-amber-500' },
        disconnected: { label: 'Desconectado', icon: Usb, color: 'text-muted-foreground' },
        error: { label: 'Revisar conexión', icon: AlertTriangle, color: 'text-red-500' },
    };
    const connection = statusInfo[status]; const StatusIcon = connection.icon;
    const printTest = async () => {
        setTesting(true); setTestResult(null);
        try {
            if (direct && defaultFormat !== 'A4') {
                const sent = await printBytes(generatePrinterTest(defaultFormat, { columns80, cutPaper }));
                setTestResult(sent ? 'Prueba enviada al puerto. Comprueba el texto y el ancho en el papel.' : 'Conecta la impresora para enviar la prueba.');
            } else {
                await printThroughIframe(printerTestHtml(defaultFormat, { columns80 }));
                setTestResult('Prueba abierta. Elige la impresora en el diálogo del sistema.');
            }
        } catch (error) { setTestResult(error instanceof Error ? error.message : 'No se pudo enviar la prueba.'); }
        finally { setTesting(false); }
    };
    return <div className={'flex min-h-0 flex-1 flex-col ' + (compact ? '' : 'rounded-xl border border-border bg-background')}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Printer className="h-4 w-4" /></div>
                <div><h3 className="text-sm font-semibold">Configuración de impresión</h3><p className="text-[11px] text-muted-foreground">Se guarda en este navegador</p></div>
            </div>
            {onClose && <button type="button" onClick={onClose} aria-label="Cerrar configuración de impresión" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-4 w-4" /></button>}
        </div>
        <div data-testid="print-settings-scroll" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
            <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-foreground">Formato de papel</legend>
                <div className="grid grid-cols-3 gap-2">
                    {(['80mm', '58mm', 'A4'] as const).map(format => <button key={format} type="button" aria-pressed={defaultFormat === format} onClick={() => { setDefaultFormat(format); setTestResult(null); }} className={'h-9 rounded-lg border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' + (defaultFormat === format ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted')}>{format}</button>)}
                </div>
            </fieldset>
            <ToggleRow label="Auto-imprimir al vender" description={direct ? 'Siempre activo en modo Directa' : 'Al finalizar una venta'} value={autoPrint} disabled={direct} onChange={setAutoPrint} />
            <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-foreground">Modo de impresión</legend>
                <div className="grid grid-cols-2 gap-2">
                    {[{ value: false, title: 'Sistema', detail: 'USB, red o Bluetooth', icon: Monitor }, { value: true, title: 'Directa', detail: 'Sin diálogo de impresión', icon: Usb }].map(mode => <label key={mode.title} className={'relative ' + (mode.value && defaultFormat === 'A4' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
                        <input type="radio" name={modeId} checked={direct === mode.value} disabled={mode.value && defaultFormat === 'A4'} onChange={() => { setUseWebSerial(mode.value); setTestResult(null); }} className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                        <span className="flex h-full items-start gap-2 rounded-lg border border-border p-2.5 peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                            <mode.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span><span className="block text-xs font-semibold">{mode.title}</span><span className="block text-[10px] leading-4 text-muted-foreground">{mode.detail}</span></span>
                        </span>
                    </label>)}
                </div>
            </fieldset>
            {direct ? <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <label className="block space-y-1 text-[11px]"><span className="block text-muted-foreground">Conexión directa</span><select aria-label="Conexión directa" disabled={busy} value={directConnection} onChange={e => setDirectConnection(e.target.value as 'serial' | 'local')} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"><option value="local">Impresoras de Windows · USB, red o Bluetooth</option><option value="serial">Puerto serial / COM</option></select></label>
                <div className="flex items-center justify-between gap-2">
                    <span className={'inline-flex min-w-0 items-center gap-1.5 text-xs ' + connection.color}><StatusIcon className={'h-3.5 w-3.5 shrink-0 ' + (status === 'connecting' ? 'animate-spin' : '')} />{connection.label}</span>
                    {status !== 'unavailable' && <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs" aria-label={status === 'connecting' && directConnection === 'serial' ? 'Cancelar conexión serial' : directConnection === 'local' ? isConnected ? 'Desconectar impresora instalada' : 'Conectar impresora instalada' : isConnected ? 'Desconectar impresora serial' : 'Conectar impresora serial'} disabled={isPrinting || testing || (status === 'connecting' && directConnection === 'local')} onClick={async () => { if (status === 'connecting') cancelConnect(); else if (isConnected) await disconnect(); else await connect(serialBaudRate); }}>{status === 'connecting' && directConnection === 'serial' ? 'Cancelar' : isConnected ? 'Desconectar' : 'Conectar'}</Button>}
                </div>
                {directConnection === 'local' ? <div className="space-y-2">
                    <p className="text-[11px] leading-4 text-muted-foreground">Usa una impresora térmica ESC/POS instalada en Windows, sin filtro de marca ni puerto COM.</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs"><a href={localPrinterSetupUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Abrir conector local</a><a href="/downloads/nexopos-print-windows.zip" download className="text-primary underline">Descargar conector Windows</a></div>
                    {printers.length > 0 && <label className="block space-y-1 text-[11px]"><span>Impresora instalada</span><select aria-label="Impresora instalada" value={printer} disabled={busy} onChange={e => void localPrinter.select(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"><option value="">Selecciona una impresora</option>{printers.map(p => <option key={p.name} value={p.name} disabled={p.offline}>{p.name}{p.offline ? ' · sin conexión' : ''}</option>)}</select></label>}
                </div> : <p className="text-[11px] leading-4 text-muted-foreground">Requiere una impresora ESC/POS con puerto COM. Una impresora instalada en USB001 o similar usa la opción Impresoras de Windows.</p>}
                {status === 'unavailable' && <p role="status" className="text-xs text-amber-500">Este navegador no permite abrir puertos COM. Elige Impresoras de Windows para usar el conector local.</p>}
                {error && status !== 'unavailable' && <p role="alert" className="text-xs text-red-500">{error}</p>}
                <details className="group border-t border-border pt-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Ajustes de la impresora<ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary>
                    <div className="mt-3 space-y-3">
                        <div className={'grid gap-3 ' + (defaultFormat === '80mm' ? 'grid-cols-2' : 'grid-cols-1')}>
                            {directConnection === 'serial' && <label className="space-y-1 text-[11px]"><span className="block text-muted-foreground">Velocidad serial</span><select aria-label="Velocidad serial" value={serialBaudRate} onChange={e => setSerialBaudRate(Number(e.target.value))} disabled={isConnected || busy} className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs">{[9600, 19200, 38400, 57600, 115200].map(rate => <option key={rate} value={rate}>{rate} baudios</option>)}</select></label>}
                            {defaultFormat === '80mm' && <label className="space-y-1 text-[11px]"><span className="block text-muted-foreground">Ancho de texto</span><select aria-label="Columnas para 80 mm" value={columns80} onChange={e => setColumns80(Number(e.target.value) as 42 | 48)} className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"><option value={48}>48 columnas</option><option value={42}>42 columnas</option></select></label>}
                        </div>
                        <ToggleRow label="Corte automático de papel" description="Para impresoras con cortador" value={cutPaper} onChange={setCutPaper} />
                    </div>
                </details>
            </div> : <p className="rounded-lg bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">{defaultFormat === 'A4' ? 'A4 utiliza el diálogo de impresión del sistema.' : 'Elige una impresora instalada en el diálogo del sistema.'}</p>}
            <p className="text-[11px] leading-4 text-muted-foreground">{direct ? 'Al confirmar el pago se imprime el comprobante o la boleta con su timbre, sin diálogos.' : 'Las boletas con timbre se abren desde su PDF.'}</p>
        </div>
        <div data-testid="print-settings-actions" className="shrink-0 space-y-2 border-t border-border bg-muted/20 px-4 py-3">
            <Button size="sm" className="h-9 w-full gap-2" disabled={busy || (direct && !isConnected)} onClick={printTest}><Printer className="h-3.5 w-3.5" />{testing ? 'Enviando prueba...' : 'Imprimir prueba sin venta'}</Button>
            <p role="status" className="text-center text-[11px] leading-4 text-muted-foreground">{testResult || (direct ? isConnected ? 'Imprime al confirmar el pago' : 'Conecta la impresora para probar' : 'No registra una venta ni emite documentos')}</p>
        </div>
    </div>;
}
function ToggleRow({ label, description, value, onChange, disabled = false }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
    return <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-medium">{label}</p><p className="text-[11px] leading-4 text-muted-foreground">{description}</p></div>
        <button type="button" role="switch" disabled={disabled} aria-label={label} aria-checked={value} onClick={() => onChange(!value)} className={'inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' + (value ? 'bg-primary' : 'bg-muted-foreground/40')}><span className={'h-4 w-4 rounded-full bg-white shadow-sm transition-transform ' + (value ? 'translate-x-4' : 'translate-x-0')} /></button>
    </div>;
}
