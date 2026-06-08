import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCloseShift, useShiftLiveSummary } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
    LogOut, Calculator, Printer, CheckCircle2, AlertTriangle,
    DollarSign, Receipt, ChevronDown, ChevronUp, Clock,
    User, Banknote, CreditCard, ArrowLeftRight, TrendingUp, ShoppingBag,
} from 'lucide-react';
import { Shift } from '@/api/shifts';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { printThroughIframe, printWithQz, isQzConnected } from '@/utils/print';

interface CloseShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    shiftId: string;
    currentShift?: Shift | null;
}

const DENOMINATIONS = [
    { label: '$20.000', value: 20000 },
    { label: '$10.000', value: 10000 },
    { label: '$5.000', value: 5000 },
    { label: '$2.000', value: 2000 },
    { label: '$1.000', value: 1000 },
    { label: '$500', value: 500 },
    { label: '$100', value: 100 },
    { label: '$50', value: 50 },
    { label: '$10', value: 10 },
];

const METHOD_CONFIG = {
    EFECTIVO:     { label: 'Efectivo',      Icon: Banknote,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
    DEBITO:       { label: 'Débito',         Icon: CreditCard,     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-100 dark:border-blue-800' },
    TRANSFERENCIA:{ label: 'Transferencia',  Icon: ArrowLeftRight, color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20',   border: 'border-violet-100 dark:border-violet-800' },
    CREDITO:      { label: 'Crédito',        Icon: CreditCard,     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',     border: 'border-amber-100 dark:border-amber-800' },
} as const;

export function CloseShiftModal({ isOpen, onClose, shiftId, currentShift }: CloseShiftModalProps) {
    const [finalAmount, setFinalAmount] = useState('');
    const [closedShift, setClosedShift] = useState<any>(null);
    const [showCalculator, setShowCalculator] = useState(false);
    const [counts, setCounts] = useState<Record<number, string>>(
        Object.fromEntries(DENOMINATIONS.map(d => [d.value, '']))
    );

    const { mutate: closeShift, isPending } = useCloseShift();
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: summary, isLoading: isLoadingSummary } = useShiftLiveSummary(isOpen && !!shiftId ? shiftId : null);
    const { printerName, useQzTray } = usePrintSettings();

    const calculatedTotal = useMemo(() => {
        return DENOMINATIONS.reduce((sum, d) => {
            const n = parseInt(counts[d.value] || '0', 10);
            return sum + (isNaN(n) ? 0 : n * d.value);
        }, 0);
    }, [counts]);

    const handleApplyCalculator = () => {
        setFinalAmount(String(calculatedTotal));
        setShowCalculator(false);
    };

    const handleCloseShift = () => {
        const amount = parseFloat(finalAmount);
        if (isNaN(amount) || amount < 0) {
            toast({ variant: 'destructive', title: 'Monto inválido', description: 'Ingresa un monto final válido.' });
            return;
        }
        if (!user?.id) {
            toast({ variant: 'destructive', title: 'Error de Sesión', description: 'No se pudo identificar al usuario.' });
            return;
        }

        closeShift(
            { shiftId, userId: user.id, finalAmount: amount },
            {
                onSuccess: (data) => {
                    setClosedShift(data);
                    // Null the cache immediately so the modal stays mounted (no currentShift = no unmount race)
                    queryClient.setQueryData(['current-shift', user?.branchId ?? ''], null);
                    toast({ variant: 'success', title: '¡Caja Cerrada!', description: 'El turno ha finalizado correctamente.' });
                },
                onError: (error: any) => {
                    toast({
                        variant: 'destructive',
                        title: 'Error al cerrar caja',
                        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
                    });
                },
            }
        );
    };

    const handleCloseDialog = () => {
        setClosedShift(null);
        setFinalAmount('');
        setCounts(Object.fromEntries(DENOMINATIONS.map(d => [d.value, ''])));
        setShowCalculator(false);
        // Force currentShift to null immediately so OpenShiftModal appears without waiting for refetch
        queryClient.setQueryData(['current-shift', user?.branchId ?? ''], null);
        onClose();
    };

    const handlePrintReport = async () => {
        if (!closedShift?.textReport) return;

        const reportHtml = `<!DOCTYPE html><html>
<head>
    <meta charset="utf-8">
    <title>Reporte Z - NexoPOS</title>
    <style>
        @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
        body { font-family: 'Courier New', Courier, monospace; white-space: pre; font-size: 13px;
               padding: 8px; color: #000; background: #fff; }
    </style>
</head>
<body>${closedShift.textReport}</body>
</html>`;

        // Impresión silenciosa con QZ Tray si está disponible
        if (useQzTray && printerName && isQzConnected()) {
            try {
                await printWithQz(closedShift.textReport, printerName, '80mm');
                return;
            } catch (err) {
                console.warn('[QZ Tray] Falló la impresión del reporte Z, usando fallback:', err);
            }
        }

        // Fallback: iframe
        await printThroughIframe(reportHtml);
    };

    // ─── Success state ────────────────────────────────────────────────────────
    if (closedShift) {
        const diff = Number(closedShift.shift.difference);
        return (
            <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl rounded-2xl">
                    <div className="bg-emerald-600 p-8 text-white flex flex-col items-center">
                        <div className="bg-white/20 p-3 rounded-full mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Cierre Exitoso</DialogTitle>
                        <p className="text-emerald-100 mt-1 uppercase tracking-widest text-[10px] font-bold">Turno Finalizado</p>
                    </div>

                    <div className="p-8 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Monto Esperado</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(Number(closedShift.shift.expectedAmount))}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Monto Declarado</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(Number(closedShift.shift.finalAmount))}</p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl flex items-center justify-between ${
                            diff === 0
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : diff < 0
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                        }`}>
                            <div className="flex items-center gap-3">
                                {diff === 0 ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                                <div>
                                    <p className="text-xs font-bold uppercase">Diferencia de Caja</p>
                                    <p className="text-lg font-black">{formatPrice(diff)}</p>
                                </div>
                            </div>
                            {diff !== 0 && (
                                <span className="text-[10px] font-bold bg-white/50 dark:bg-black/20 px-2 py-1 rounded uppercase tracking-tight">
                                    {diff < 0 ? 'Faltante' : 'Sobrante'}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                <Receipt size={13} /> Vista Previa Reporte Z
                            </div>
                            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono leading-tight max-h-[180px] overflow-y-auto custom-scrollbar border border-slate-800 shadow-inner whitespace-pre">
                                {closedShift.textReport}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-12 border-2 font-bold" onClick={handlePrintReport}>
                                <Printer size={17} className="mr-2" /> Imprimir Z
                            </Button>
                            <Button className="flex-1 h-12 bg-slate-900 hover:bg-black text-white font-bold" onClick={handleCloseDialog}>
                                Continuar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ─── Input state ──────────────────────────────────────────────────────────
    const shiftElapsed = currentShift
        ? formatDistanceToNow(new Date(currentShift.startTime), { locale: es, addSuffix: false })
        : null;
    const shiftStart = currentShift
        ? format(new Date(currentShift.startTime), "HH:mm 'del' dd/MM/yyyy", { locale: es })
        : null;

    const cashierName = summary?.openedBy ?? user?.name ?? user?.email ?? '—';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 p-7 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-4 right-4 opacity-10">
                        <LogOut size={110} />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="bg-white/20 w-11 h-11 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md">
                            <Calculator className="text-white" size={22} />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Cierre de Caja</DialogTitle>
                        <p className="text-red-100 text-sm mt-1">Ingresa el recuento final de efectivo para cerrar el turno.</p>
                        {shiftElapsed && (
                            <div className="flex items-center gap-2 mt-2 text-red-200 text-xs">
                                <Clock size={12} />
                                <span>Turno activo hace <strong className="text-white">{shiftElapsed}</strong>{shiftStart && ` (desde ${shiftStart})`}</span>
                            </div>
                        )}
                    </DialogHeader>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">

                    {/* Cajero + Turno info */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
                            <div className="flex items-center gap-2.5 p-3">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0">
                                    <User size={14} className="text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">Cajero</p>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">{cashierName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 p-3">
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg shrink-0">
                                    <DollarSign size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">Base Inicial</p>
                                    <p className="text-xs font-bold text-emerald-600 mt-0.5">
                                        {currentShift ? formatPrice(currentShift.initialAmount) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ventas del turno */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                <TrendingUp size={13} className="text-indigo-500" />
                                Ventas del Turno
                            </div>
                            {isLoadingSummary ? (
                                <div className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <ShoppingBag size={12} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500">
                                        {summary?.salesCount ?? 0} {summary?.salesCount === 1 ? 'venta' : 'ventas'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {(Object.keys(METHOD_CONFIG) as (keyof typeof METHOD_CONFIG)[]).map((method) => {
                                const { label, Icon, color, bg, border } = METHOD_CONFIG[method];
                                const amount = summary?.paymentMethods[method] ?? 0;
                                const hasAmount = amount > 0;
                                return (
                                    <div key={method} className={`flex items-center justify-between px-4 py-2.5 ${!hasAmount ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg ${bg} border ${border}`}>
                                                <Icon size={13} className={color} />
                                            </div>
                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                                        </div>
                                        {isLoadingSummary ? (
                                            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                                        ) : (
                                            <span className={`text-sm font-bold tabular-nums ${hasAmount ? color : 'text-slate-400'}`}>
                                                {formatPrice(amount)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total ventas */}
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Ventas</span>
                            {isLoadingSummary ? (
                                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
                            ) : (
                                <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                                    {formatPrice(summary?.totalSales ?? 0)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Cuadratura previa */}
                    {summary && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl px-4 py-3">
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-black tracking-widest mb-2">Monto Esperado en Caja</p>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                                <span className="font-semibold">{formatPrice(summary.initialAmount)}</span>
                                <span className="text-slate-400">base</span>
                                <span className="text-slate-400">+</span>
                                <span className="font-semibold text-emerald-600">{formatPrice(summary.paymentMethods.EFECTIVO)}</span>
                                <span className="text-slate-400">efectivo</span>
                                <span className="text-slate-400">=</span>
                                <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">{formatPrice(summary.expectedAmount)}</span>
                            </div>
                        </div>
                    )}

                    {/* Amount input */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <Banknote size={13} className="text-emerald-500" />
                                Efectivo Total en Caja
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCalculator(s => !s)}
                                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
                            >
                                <Calculator size={13} />
                                Calcular
                                {showCalculator ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>

                        {/* Denomination calculator */}
                        {showCalculator && (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calculadora de Denominaciones</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        Total: <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(calculatedTotal)}</span>
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {DENOMINATIONS.map(d => {
                                        const n = parseInt(counts[d.value] || '0', 10);
                                        const subtotal = isNaN(n) ? 0 : n * d.value;
                                        return (
                                            <div key={d.value} className="grid grid-cols-[80px_1fr_80px] items-center gap-2 px-4 py-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{d.label}</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={counts[d.value]}
                                                    onChange={e => setCounts(prev => ({ ...prev, [d.value]: e.target.value }))}
                                                    placeholder="0"
                                                    className="h-8 text-center text-sm font-semibold border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg focus:border-indigo-400"
                                                />
                                                <span className="text-xs text-right font-semibold text-slate-500 tabular-nums">
                                                    {subtotal > 0 ? formatPrice(subtotal) : '—'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-between border-t border-indigo-100 dark:border-indigo-800">
                                    <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                                        Total calculado: {formatPrice(calculatedTotal)}
                                    </span>
                                    <Button
                                        size="sm"
                                        onClick={handleApplyCalculator}
                                        className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                                    >
                                        Aplicar
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-red-500 transition-colors">
                                <span className="text-xl font-semibold">$</span>
                            </div>
                            <Input
                                id="finalAmount"
                                type="number"
                                value={finalAmount}
                                onChange={(e) => setFinalAmount(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCloseShift()}
                                autoFocus={!showCalculator}
                                className="pl-10 h-16 text-2xl font-bold border-2 border-slate-200 dark:border-slate-700 focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-slate-950 transition-all rounded-xl shadow-sm"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions - sticky footer */}
                <div className="shrink-0 px-6 pb-6 pt-2 flex gap-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 h-12 font-bold text-slate-500 hover:text-slate-900"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCloseShift}
                        disabled={isPending || !finalAmount}
                        className="flex-[2] h-14 text-base font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 rounded-xl"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Cerrando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <LogOut size={18} />
                                <span>Finalizar Turno</span>
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
