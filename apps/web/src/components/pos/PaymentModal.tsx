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
import { CheckCircle2, XCircle, Banknote, CreditCard, RefreshCw, Layers, Calculator, FileText, Building2, Truck } from 'lucide-react';
import { type CartItemData } from '@/context/CartContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { printSaleAction } from './receipts/ReceiptRenderer';
import { useTenant } from '@/hooks/useTenant';
import { useEffect, useState, useMemo } from 'react';
import { PaymentMethod, type PaymentRequestData } from '@/api/sales';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/api/customers';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@/api/types';
import { TransbankPaymentModal } from './TransbankPaymentModal';
import type { TransbankPaymentResult } from '@/hooks/useTransbankPayment';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payments: PaymentRequestData[], dteType: number, customerId?: string) => void;
    items: CartItemData[];
    subtotal: number;
    totalDiscount: number;
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
    totalDiscount,
    tax,
    total,
    isProcessing,
    isSuccess,
    isError,
    saleResult,
}: PaymentModalProps) {
    const { autoPrint, defaultFormat, setDefaultFormat } = usePrintSettings();
    const [hasAttemptedAutoPrint, setHasAttemptedAutoPrint] = useState(false);
    const [countdown, setCountdown] = useState(4);
    const { user } = useAuth();
    const { data: tenant } = useTenant(user?.tenantId);

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

    // Transbank state
    const [transbankOpen, setTransbankOpen]           = useState(false);
    const [transbankResult, setTransbankResult]       = useState<TransbankPaymentResult | null>(null);
    const [pendingPayments, setPendingPayments]       = useState<PaymentRequestData[] | null>(null);
    const [pendingDteType, setPendingDteType]         = useState<number>(39);
    const [pendingCustomerId, setPendingCustomerId]   = useState<string | undefined>(undefined);

    // DTE States
    const [dteType, setDteType] = useState<39 | 33 | 52>(39);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Fetch customers only when Factura is selected
    const { data: customers = [] } = useQuery({
        queryKey: ['customers', user?.tenantId],
        queryFn: () => getCustomers(user?.tenantId),
        enabled: dteType === 33 && !!user?.tenantId,
        staleTime: 5 * 60 * 1000,
    });

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers.slice(0, 8);
        const q = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(q) || c.rut.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [customers, customerSearch]);

    // Auto-print effect
    useEffect(() => {
        if (isSuccess && saleResult && autoPrint && !hasAttemptedAutoPrint) {
            setHasAttemptedAutoPrint(true);
            printSaleAction(saleResult, defaultFormat, tenant);
        }
    }, [isSuccess, saleResult, autoPrint, defaultFormat, hasAttemptedAutoPrint, tenant]);

    // Auto-close countdown after success
    useEffect(() => {
        if (!isSuccess) { setCountdown(4); return; }
        if (countdown <= 0) { onClose(); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [isSuccess, countdown, onClose]);

    // Reset all states when modal opens
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
            setDteType(39);
            setCustomerSearch('');
            setSelectedCustomer(null);
            setShowCustomerDropdown(false);
        }
    }, [isOpen]);

    const totalMixed: number = useMemo(() => {
        return Object.values(mixedPayments).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
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

    const canConfirm = dteType === 33 ? !!selectedCustomer : true;

    const isTransbankMethod = (method: string) =>
        method === PaymentMethod.DEBIT || method === PaymentMethod.CARD;

    const handleConfirm = () => {
        const customerId = selectedCustomer?.id;
        let payments: PaymentRequestData[];

        if (paymentType === 'SINGLE') {
            payments = [{ paymentMethod: singleMethod, amount: total }];
        } else {
            payments = Object.entries(mixedPayments)
                .filter(([, amt]) => (Number(amt) || 0) > 0)
                .map(([method, amt]) => ({ paymentMethod: method, amount: Number(amt) || 0 }));
        }

        // Si el único método es débito o crédito, pasa por Transbank primero
        const isSingleCardPayment =
            payments.length === 1 && isTransbankMethod(payments[0].paymentMethod);

        if (isSingleCardPayment && !transbankResult) {
            setPendingPayments(payments);
            setPendingDteType(dteType);
            setPendingCustomerId(customerId);
            setTransbankOpen(true);
            return;
        }

        onConfirm(payments, dteType, customerId);
    };

    const handleTransbankApproved = (result: TransbankPaymentResult) => {
        setTransbankResult(result);
        setTransbankOpen(false);
        if (pendingPayments) {
            onConfirm(pendingPayments, pendingDteType, pendingCustomerId);
        }
    };

    const transbankCardType =
        pendingPayments?.[0]?.paymentMethod === PaymentMethod.DEBIT ? 'DEBITO' : 'CREDITO';

    if (transbankOpen) {
        return (
            <TransbankPaymentModal
                isOpen={transbankOpen}
                amount={total}
                cardType={transbankCardType}
                onApproved={handleTransbankApproved}
                onCancel={() => { setTransbankOpen(false); setPendingPayments(null); }}
            />
        );
    }

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-6 h-6" />
                                <DialogTitle>¡Venta exitosa!</DialogTitle>
                            </div>
                            <span className="text-xs text-slate-400">Cerrando en {countdown}s</span>
                        </div>
                        <DialogDescription>
                            {autoPrint ? 'Imprimiendo ticket automáticamente...' : 'La venta se ha procesado correctamente.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted p-4 rounded-lg space-y-3 mb-2">
                        {saleResult?.dteFolio && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">Folio DTE:</span>
                                <span className="font-bold text-lg">#{saleResult.dteFolio}</span>
                            </div>
                        )}

                        {saleResult?.dtePdfUrl && !saleResult.dtePdfUrl.includes('ejemplo-mock') && (
                            <Button className="w-full" variant="outline"
                                onClick={() => window.open(saleResult.dtePdfUrl, '_blank')}>
                                Ver DTE (PDF)
                            </Button>
                        )}

                        {saleResult?.internalReceiptUrl && (
                            <Button className="w-full" variant="outline"
                                onClick={() => {
                                    const apiUrl = import.meta.env.VITE_API_URL || '';
                                    window.open(`${apiUrl}${saleResult.internalReceiptUrl}`, '_blank');
                                }}>
                                Ver Ticket Interno (PDF)
                            </Button>
                        )}

                        {/* Reprint + format selector */}
                        <div className="flex gap-2">
                            <Button className="flex-1" variant="secondary"
                                onClick={() => printSaleAction(saleResult, defaultFormat, tenant)}>
                                Reimprimir Ticket
                            </Button>
                            <select
                                value={defaultFormat}
                                onChange={(e) => setDefaultFormat(e.target.value as '80mm' | '50mm' | 'A4')}
                                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none"
                            >
                                <option value="80mm">80mm</option>
                                <option value="50mm">50mm</option>
                                <option value="A4">A4</option>
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={onClose} className="w-full" variant="outline">
                            Cerrar ahora
                        </Button>
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
                        Selecciona el tipo de documento y método de pago.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Resumen de Venta */}
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-2">
                            <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Resumen</h4>
                            <div className="space-y-1 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => {
                                    const baseTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                                    let finalTotal = baseTotal;
                                    const dVal = Number(item.discountValue) || 0;
                                    if (dVal && item.discountType) {
                                        if (item.discountType === 'PERCENTAGE') {
                                            finalTotal -= (baseTotal * dVal) / 100;
                                        } else {
                                            finalTotal -= dVal;
                                        }
                                    }
                                    finalTotal = Math.max(0, finalTotal);
                                    const isDiscounted = finalTotal < baseTotal || (item.price !== "" && item.price < item.basePrice);
                                    const originalTotal = Number(item.basePrice || item.price) * Number(item.quantity);

                                    return (
                                        <div key={item.productId} className="flex justify-between items-start text-xs font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                                                    {item.name} <span className="text-[10px] opacity-70 font-bold">x{item.quantity}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-slate-900 dark:text-slate-200">{formatPrice(finalTotal)}</span>
                                                {isDiscounted && (
                                                    <span className="text-[10px] text-slate-400 line-through">
                                                        {formatPrice(originalTotal)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-xs text-rose-500 font-medium">
                                    <span>Descuento</span>
                                    <span>-{formatPrice(totalDiscount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-xs text-slate-500">
                                <span className="opacity-70 italic text-[10px]">Neto</span>
                                <span className="opacity-70 text-[10px]">{formatPrice(total - tax)}</span>
                            </div>

                            <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                                <span>IVA (19%)</span>
                                <span>{formatPrice(tax)}</span>
                            </div>

                            <div className="flex justify-between text-xl font-black pt-3 border-t border-slate-100 mt-2">
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

                    {/* Tipo de Documento + Métodos de Pago */}
                    <div className="space-y-4">
                        {/* DTE Type Selector */}
                        <div>
                            <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Tipo de Documento</h4>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setDteType(39)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${dteType === 39 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" /> Boleta
                                </button>
                                <button
                                    onClick={() => { setDteType(33); setSelectedCustomer(null); setCustomerSearch(''); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${dteType === 33 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    <Building2 className="w-3.5 h-3.5" /> Factura
                                </button>
                                <button
                                    onClick={() => { setDteType(52); setSelectedCustomer(null); setCustomerSearch(''); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${dteType === 52 ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    <Truck className="w-3.5 h-3.5" /> Guía
                                </button>
                            </div>

                            {dteType === 33 && (
                                <div className="relative mt-2">
                                    <Input
                                        placeholder="Buscar cliente por RUT o nombre..."
                                        value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.rut})` : customerSearch}
                                        onChange={(e) => {
                                            if (selectedCustomer) setSelectedCustomer(null);
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                        className="text-sm pr-8"
                                    />
                                    {selectedCustomer && (
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                                        >
                                            <XCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                        </button>
                                    )}
                                    {showCustomerDropdown && !selectedCustomer && filteredCustomers.length > 0 && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setShowCustomerDropdown(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{c.name}</div>
                                                    <div className="text-xs text-slate-400">{c.rut}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {!selectedCustomer && (
                                        <p className="text-xs text-amber-600 mt-1">Se requiere cliente para emitir Factura</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Type Tabs */}
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

                {paymentType === 'MIXED' && !isTotalCovered && (
                    <Badge variant="outline" className="w-full justify-center border-dashed border-rose-300 text-rose-500 bg-rose-50 dark:bg-rose-900/10 py-2">
                        Faltan {formatPrice(remaining)}
                    </Badge>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="font-bold text-slate-500">
                        CANCELAR
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing || (paymentType === 'MIXED' && !isTotalCovered) || !canConfirm}
                        className={`flex-1 h-12 text-lg font-black tracking-tight rounded-xl transition-all duration-300 ${(paymentType === 'MIXED' && !isTotalCovered) || !canConfirm
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
