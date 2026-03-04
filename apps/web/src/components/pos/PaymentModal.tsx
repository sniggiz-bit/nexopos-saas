import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/utils/formatters';
import { CheckCircle2, XCircle, Banknote, CreditCard, RefreshCw, Layers, Calculator } from 'lucide-react';
import { type CartItemData } from '@/context/CartContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePrintSettings, type PrintFormat } from '@/hooks/usePrintSettings';
import { printSaleAction } from './receipts/ReceiptRenderer';
import { useEffect, useState, useMemo } from 'react';
import { PaymentMethod, type PaymentRequestData } from '@/api/sales';
import { Badge } from '@/components/ui/badge';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payments: PaymentRequestData[]) => void;
    items: CartItemData[];
    subtotal: number;
    tax: number;
    total: number;
    isProcessing: boolean;
    isSuccess: boolean;
    isError: boolean;
    saleResult?: any;
}

type PaymentType = 'SINGLE' | 'MIXED';

export function PaymentModal({
    isOpen,
    onClose,
    onConfirm,
    items,
    subtotal,
    tax,
    total,
    isProcessing,
    isSuccess,
    isError,
    saleResult,
}: PaymentModalProps) {
    const { autoPrint, setAutoPrint, defaultFormat, setDefaultFormat } = usePrintSettings();
    const [hasAttemptedAutoPrint, setHasAttemptedAutoPrint] = useState(false);

    // Payment Logic States
    const [paymentType, setPaymentType] = useState<PaymentType>('SINGLE');
    const [singleMethod, setSingleMethod] = useState<string>(PaymentMethod.CASH);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [mixedPayments, setMixedPayments] = useState<Record<string, number | ''>>({
        [PaymentMethod.CASH]: 0,
        [PaymentMethod.DEBIT]: 0,
        [PaymentMethod.CARD]: 0,
        [PaymentMethod.TRANSFER]: 0,
    });

    // Auto-print effect
    useEffect(() => {
        if (isSuccess && saleResult && autoPrint && !hasAttemptedAutoPrint) {
            setHasAttemptedAutoPrint(true);
            printSaleAction(saleResult, defaultFormat);
        }
    }, [isSuccess, saleResult, autoPrint, defaultFormat, hasAttemptedAutoPrint]);

    // Reset auto-print and payment states when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasAttemptedAutoPrint(false);
            setPaymentType('SINGLE');
            setSingleMethod(PaymentMethod.CASH);
            setCashReceived('');
            setMixedPayments({
                [PaymentMethod.CASH]: 0,
                [PaymentMethod.DEBIT]: 0,
                [PaymentMethod.CARD]: 0,
                [PaymentMethod.TRANSFER]: 0,
            });
        }
    }, [isOpen]);

    const totalMixed = useMemo(() => {
        return Object.values(mixedPayments).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, [mixedPayments]);

    const remaining = total - totalMixed;
    const isTotalCovered = Math.abs(remaining) < 0.01;

    const change = useMemo(() => {
        const received = parseFloat(cashReceived) || 0;
        if (paymentType === 'SINGLE' && singleMethod === PaymentMethod.CASH) {
            return Math.max(0, received - total);
        }
        return 0;
    }, [paymentType, singleMethod, cashReceived, total]);

    const handleConfirm = () => {
        if (paymentType === 'SINGLE') {
            onConfirm([{ paymentMethod: singleMethod, amount: total }]);
        } else {
            const payments = Object.entries(mixedPayments)
                .filter(([_, amount]) => (Number(amount) || 0) > 0)
                .map(([method, amount]) => ({ paymentMethod: method, amount: Number(amount) || 0 }));
            onConfirm(payments);
        }
    };

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-6 h-6" />
                            <DialogTitle>¡Venta exitosa!</DialogTitle>
                        </div>
                        <DialogDescription>
                            La venta se ha procesado correctamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted p-4 rounded-lg space-y-3 mb-4">
                        {saleResult?.dteFolio && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">Folio DTE:</span>
                                <span className="font-bold text-lg">#{saleResult.dteFolio}</span>
                            </div>
                        )}

                        {saleResult?.dtePdfUrl && !saleResult.dtePdfUrl.includes('ejemplo-mock') && (
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => window.open(saleResult.dtePdfUrl, '_blank')}
                            >
                                Ver Boleta (PDF)
                            </Button>
                        )}

                        {saleResult?.internalReceiptUrl && (
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => {
                                    const apiUrl = import.meta.env.VITE_API_URL || '';
                                    const fullUrl = `${apiUrl}${saleResult.internalReceiptUrl}`;
                                    window.open(fullUrl, '_blank');
                                }}
                            >
                                Ver Ticket Interno (PDF)
                            </Button>
                        )}

                        <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => printSaleAction(saleResult, defaultFormat)}
                        >
                            Imprimir Ticket ({defaultFormat})
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button onClick={onClose} className="w-full">Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (isError) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="w-6 h-6" />
                            <DialogTitle>Error al procesar la venta</DialogTitle>
                        </div>
                        <DialogDescription>
                            Hubo un problema al procesar la venta. Por favor, intenta nuevamente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                        <Button onClick={handleConfirm}>Reintentar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Checkout</DialogTitle>
                    <DialogDescription>
                        Selecciona el método de pago y confirma la transacción.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Resumen de Venta */}
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-2">
                            <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Resumen</h4>
                            <div className="space-y-1 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                                            {item.name} <span className="text-[10px] opacity-70">x{item.quantity}</span>
                                        </span>
                                        <span>{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>IVA (19%)</span>
                                <span>{formatPrice(tax)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black pt-2">
                                <span className="text-slate-400">TOTAL</span>
                                <span className="text-emerald-600">{formatPrice(total)}</span>
                            </div>
                        </div>

                        {paymentType === 'SINGLE' && singleMethod === PaymentMethod.CASH && (
                            <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Vuelto</span>
                                    <span className={`text-2xl font-black ${change > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                        {formatPrice(change)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {paymentType === 'MIXED' && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                                        <span>Cubierto</span>
                                        <span className="text-emerald-500">{formatPrice(totalMixed)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                                        <span>Pendiente</span>
                                        <span className={remaining > 0 ? 'text-rose-500' : 'text-slate-400'}>
                                            {formatPrice(Math.max(0, remaining))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Métodos de Pago */}
                    <div className="space-y-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setPaymentType('SINGLE')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${paymentType === 'SINGLE' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'
                                    }`}
                            >
                                <RefreshCw className="w-4 h-4" /> Único
                            </button>
                            <button
                                onClick={() => setPaymentType('MIXED')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${paymentType === 'MIXED' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'
                                    }`}
                            >
                                <Layers className="w-4 h-4" /> Mixto
                            </button>
                        </div>

                        {paymentType === 'SINGLE' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
                                        { id: PaymentMethod.DEBIT, label: 'Débito', icon: Calculator },
                                        { id: PaymentMethod.CARD, label: 'Crédito', icon: CreditCard },
                                        { id: PaymentMethod.TRANSFER, label: 'Transf.', icon: RefreshCw },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSingleMethod(m.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${singleMethod === m.id
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <m.icon className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] font-black uppercase">{m.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {singleMethod === 'EFECTIVO' && (
                                    <div className="space-y-2 pt-2 animate-in zoom-in-95 duration-200">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Monto Recibido</Label>
                                        <div className="relative">
                                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <Input
                                                type="number"
                                                autoFocus
                                                value={cashReceived}
                                                onChange={(e) => setCashReceived(e.target.value)}
                                                className="pl-10 h-12 text-xl font-bold border-2 focus-visible:ring-indigo-500"
                                                placeholder="Ej: 5000"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                {[
                                    { id: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
                                    { id: PaymentMethod.DEBIT, label: 'Débito', icon: Calculator },
                                    { id: PaymentMethod.CARD, label: 'Crédito', icon: CreditCard },
                                    { id: PaymentMethod.TRANSFER, label: 'Transferencia', icon: RefreshCw },
                                ].map((m) => (
                                    <div key={m.id} className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                            <m.icon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <span className="text-[9px] font-black uppercase text-slate-400 group-focus-within:text-indigo-500">
                                                {m.label}
                                            </span>
                                        </div>
                                        <Input
                                            type="number"
                                            value={mixedPayments[m.id] ?? ''}
                                            onChange={(e) => setMixedPayments({
                                                ...mixedPayments,
                                                [m.id]: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                                            })}
                                            className="pl-24 h-10 font-bold border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 text-right"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-print" className="font-bold">Imprimir Comprobante</Label>
                            <p className="text-[10px] text-muted-foreground">Dispara la impresión automáticamente</p>
                        </div>
                        <Switch
                            id="auto-print"
                            checked={autoPrint}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoPrint(e.target.checked)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Formato</Label>
                            <Select value={defaultFormat} onValueChange={(v: string) => setDefaultFormat(v as PrintFormat)}>
                                <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-900 border-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="80mm">Ticket 80mm</SelectItem>
                                    <SelectItem value="50mm">Ticket 50mm</SelectItem>
                                    <SelectItem value="A4">Boleta A4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end pr-1">
                            {paymentType === 'MIXED' && !isTotalCovered && (
                                <Badge variant="outline" className="h-9 w-full justify-center border-dashed border-rose-300 text-rose-500 bg-rose-50 dark:bg-rose-900/10">
                                    Faltan {formatPrice(remaining)}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="font-bold text-slate-500">
                        CANCELAR
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing || (paymentType === 'MIXED' && !isTotalCovered)}
                        className={`flex-1 h-12 text-lg font-black tracking-tight rounded-xl transition-all duration-300 ${(paymentType === 'MIXED' && !isTotalCovered)
                            ? 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95'
                            }`}
                    >
                        {isProcessing ? 'PROCESANDO...' : 'CONFIRMAR PAGO'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
