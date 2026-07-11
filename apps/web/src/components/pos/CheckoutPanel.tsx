import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/formatters';
import {
    CheckCircle2, XCircle, Banknote, CreditCard, RefreshCw,
    Layers, Calculator, FileText, Building2, Truck, ArrowLeft, ChevronRight,
} from 'lucide-react';
import { PaymentMethod, type PaymentRequestData } from '@/api/sales';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/api/customers';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@/api/types';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { printSaleAction } from './receipts/ReceiptRenderer';
import { useTenant } from '@/hooks/useTenant';

interface CheckoutPanelProps {
    subtotal: number;
    totalDiscount: number;
    tax: number;
    total: number;
    onConfirm: (payments: PaymentRequestData[], dteType: number, customerId?: string) => Promise<any>;
    onBack: () => void;
    isProcessing: boolean;
    isSuccess: boolean;
    isError: boolean;
    saleResult?: any;
}

type PaymentType = 'SINGLE' | 'MIXED';

export function CheckoutPanel({
    subtotal, totalDiscount, tax, total,
    onConfirm, onBack,
    isProcessing, isSuccess, isError, saleResult,
}: CheckoutPanelProps) {
    const { autoPrint, defaultFormat, setDefaultFormat, printerName, useQzTray } = usePrintSettings();
    const [countdown, setCountdown] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { data: tenant } = useTenant(user?.tenantId);

    const [paymentType, setPaymentType] = useState<PaymentType>('SINGLE');
    const [singleMethod, setSingleMethod] = useState<string>(PaymentMethod.DEBIT);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [mixedPayments, setMixedPayments] = useState<Record<string, number | ''>>({
        [PaymentMethod.CASH]: 0,
        [PaymentMethod.DEBIT]: 0,
        [PaymentMethod.CARD]: 0,
        [PaymentMethod.TRANSFER]: 0,
    });

    const [dteType, setDteType] = useState<39 | 33 | 52>(39);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    type Step = 'dte' | 'payment' | 'cash' | 'confirm';
    const [activeStep, setActiveStep] = useState<Step>('cash');
    const cashInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus cash input when step advances to 'cash'
    useEffect(() => {
        if (activeStep === 'cash') {
            setTimeout(() => cashInputRef.current?.focus(), 30);
        }
    }, [activeStep]);

    // Detect if credit is involved in the current payment selection
    const hasCreditSingle = paymentType === 'SINGLE' && singleMethod === PaymentMethod.CARD;
    const hasCreditMixed  = paymentType === 'MIXED' && (Number(mixedPayments[PaymentMethod.CARD]) || 0) > 0;
    const isCreditPayment = hasCreditSingle || hasCreditMixed;

    const { data: customers = [] } = useQuery({
        queryKey: ['customers', user?.tenantId],
        queryFn: () => getCustomers(user?.tenantId),
        enabled: (dteType === 33 || isCreditPayment) && !!user?.tenantId,
        staleTime: 5 * 60 * 1000,
    });

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers.slice(0, 8);
        const q = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(q) || c.rut.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [customers, customerSearch]);

    // La impresión auto se dispara UNA SOLA VEZ desde handleConfirm, justo después
    // de recibir el resultado de la venta. El useEffect redundante fue eliminado
    // para evitar doble llamada al diálogo de impresión.

    useEffect(() => {
        if (!isSuccess) { setCountdown(4); return; }
        if (countdown <= 0) { onBack(); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [isSuccess, countdown, onBack]);

    const totalMixed = useMemo(
        () => Object.values(mixedPayments).reduce((sum: number, v) => sum + (Number(v) || 0), 0),
        [mixedPayments],
    );
    const remaining = total - totalMixed;
    const isTotalCovered = Math.abs(remaining) < 0.01;

    const change = useMemo(() => {
        const received = parseFloat(cashReceived) || 0;
        if (paymentType === 'SINGLE' && singleMethod === PaymentMethod.CASH) {
            return Math.max(0, received - total);
        }
        return 0;
    }, [paymentType, singleMethod, cashReceived, total]);

    const canConfirm = (dteType === 33 || isCreditPayment) ? !!selectedCustomer : true;

    const handleConfirm = useCallback(async () => {
        const customerId = selectedCustomer?.id;
        let payments: PaymentRequestData[];
        if (paymentType === 'SINGLE') {
            payments = [{ paymentMethod: singleMethod, amount: total }];
        } else {
            payments = Object.entries(mixedPayments)
                .filter(([, amount]) => (Number(amount) || 0) > 0)
                .map(([method, amount]) => ({ paymentMethod: method, amount: Number(amount) || 0 }));
        }

        try {
            setIsSubmitting(true);
            const result = await onConfirm(payments, dteType, customerId);
            if (autoPrint && result) {
                // Impresión silenciosa con QZ Tray si está disponible, fallback iframe
                printSaleAction(result, defaultFormat, tenant, printerName || undefined, useQzTray);
            }
        } catch (_err) {
            // Handled in mutation/toast
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedCustomer, paymentType, singleMethod, total, dteType, mixedPayments, onConfirm, autoPrint, defaultFormat, tenant, printerName, useQzTray]);

    useEffect(() => {
        if (isSuccess || isError) return;
        const onKey = (e: KeyboardEvent) => {
            // Allow all shortcuts when in the cash step (even while typing in the input)
            const isInCashStep = activeStep === 'cash';
            const tag = (e.target as HTMLElement).tagName;
            const inInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !isInCashStep;

            if (e.key === 'Escape') { e.preventDefault(); if (!isProcessing && !isSubmitting) onBack(); return; }

            // DTE type — always active → advances to payment step
            if (e.key === 'F1') { e.preventDefault(); setDteType(39); setSelectedCustomer(null); setCustomerSearch(''); setActiveStep('payment'); return; }
            if (e.key === 'F2') { e.preventDefault(); setDteType(33); setSelectedCustomer(null); setCustomerSearch(''); setActiveStep('payment'); return; }
            if (e.key === 'F3') { e.preventDefault(); setDteType(52); setSelectedCustomer(null); setCustomerSearch(''); setActiveStep('payment'); return; }

            if (inInput) return;

            // Payment method
            if (e.key === 'F5') { e.preventDefault(); setPaymentType('SINGLE'); setSingleMethod(PaymentMethod.DEBIT); setActiveStep('cash'); return; }
            if (e.key === 'F6') { e.preventDefault(); setPaymentType('SINGLE'); setSingleMethod(PaymentMethod.CASH); setActiveStep('cash'); return; }
            if (e.key === 'F7') { e.preventDefault(); setPaymentType('SINGLE'); setSingleMethod(PaymentMethod.CARD); setActiveStep('cash'); return; }
            if (e.key === 'F8') { e.preventDefault(); setPaymentType('SINGLE'); setSingleMethod(PaymentMethod.TRANSFER); setActiveStep('cash'); return; }

            // Confirm — F12 from anywhere, Enter only from cash step
            if (e.key === 'F12' || (e.key === 'Enter' && isInCashStep)) {
                e.preventDefault();
                if (!isProcessing && !isSubmitting) {
                    if (paymentType === 'MIXED' && !isTotalCovered) return;
                    if (!canConfirm) {
                        // Factura sin cliente: volver al paso DTE para que el usuario lo corrija
                        setActiveStep('dte');
                        return;
                    }
                    handleConfirm();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isSuccess, isError, isProcessing, canConfirm, activeStep, paymentType, isTotalCovered, onBack, handleConfirm]);

    // ── Success state ─────────────────────────────────────────────────────────
    const hasRealDtePdf = saleResult?.dtePdfUrl && !saleResult.dtePdfUrl.includes('ejemplo-mock');

    if (isSuccess) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-800">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-slate-900 dark:text-foreground">¡Venta exitosa!</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {autoPrint
                                ? hasRealDtePdf
                                    ? 'Abriendo PDF con Timbre Electrónico (TED)...'
                                    : 'Imprimiendo ticket...'
                                : 'Procesada correctamente'}
                        </p>
                    </div>

                    {saleResult?.dteFolio && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-6 py-3 text-center">
                            <span className="text-xs text-slate-400 block mb-1">Folio DTE</span>
                            <span className="text-2xl font-black text-indigo-600">#{saleResult.dteFolio}</span>
                        </div>
                    )}

                    {hasRealDtePdf && (
                        <Button className="w-full" variant="outline"
                            onClick={() => window.open(saleResult!.dtePdfUrl!, '_blank')}>
                            📄 Abrir / Imprimir PDF oficial (con TED)
                        </Button>
                    )}

                    {saleResult?.internalReceiptUrl && (
                        <Button className="w-full" variant="outline"
                            onClick={() => {
                                const apiUrl = import.meta.env.VITE_API_URL || '';
                                window.open(`${apiUrl}${saleResult!.internalReceiptUrl}`, '_blank');
                            }}>
                            Ver Ticket Interno
                        </Button>
                    )}

                    <div className="flex gap-2 w-full">
                        <Button
                            className="flex-1"
                            variant="secondary"
                            onClick={() => printSaleAction(saleResult, defaultFormat, tenant, printerName || undefined, useQzTray)}
                        >
                            {hasRealDtePdf ? '🖨 Reimprimir PDF DTE' : 'Reimprimir Ticket'}
                        </Button>
                        {!hasRealDtePdf && (
                            <select
                                value={defaultFormat}
                                onChange={(e) => setDefaultFormat(e.target.value as '80mm' | '58mm' | 'A4')}
                                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none"
                            >
                                <option value="80mm">80mm</option>
                                <option value="58mm">58mm</option>
                                <option value="A4">A4</option>
                            </select>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                    <Button onClick={onBack} className="w-full" variant="outline">
                        Cerrar ({countdown}s)
                    </Button>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (isError) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-800">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <XCircle className="w-9 h-9 text-red-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-slate-900 dark:text-foreground">Error en la venta</h3>
                        <p className="text-sm text-slate-400 mt-1">Por favor, intenta nuevamente.</p>
                    </div>
                </div>
                <div className="flex gap-2 p-4 border-t border-slate-100 dark:border-slate-700">
                    <Button variant="outline" onClick={onBack} className="flex-1">Cancelar</Button>
                    <Button onClick={handleConfirm}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    // ── Checkout form ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Checkout
                </h3>
                <span className="ml-auto text-[9px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Esc volver</span>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 shrink-0">
                {([
                    { steps: ['dte'] as Step[], num: 1, label: 'Documento' },
                    { steps: ['payment'] as Step[], num: 2, label: 'Pago' },
                    { steps: ['cash', 'confirm'] as Step[], num: 3, label: activeStep === 'cash' ? 'Monto' : 'Confirmar' },
                ]).map(({ steps, num, label }, i) => {
                    const isActive = steps.includes(activeStep);
                    return (
                        <div key={num} className="flex items-center gap-1">
                            <div className={`flex items-center gap-1 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                    isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>{num}</div>
                                <span className="text-[10px] font-bold">{label}</span>
                            </div>
                            {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300 ml-1" />}
                        </div>
                    );
                })}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

                {/* Totals summary */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-xs text-rose-500 font-medium">
                            <span>Descuento</span><span>−{formatPrice(totalDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>IVA (19%)</span><span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between font-black text-base pt-1.5 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">TOTAL</span>
                        <span className="text-emerald-600">{formatPrice(total)}</span>
                    </div>
                </div>

                {/* DTE selector */}
                <div className={`rounded-xl transition-all duration-200 ${activeStep === 'dte' ? 'ring-2 ring-indigo-400 p-2 bg-indigo-50/30 dark:bg-indigo-900/10' : 'opacity-75'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${activeStep === 'dte' ? 'text-indigo-500' : 'text-slate-400'}`}>
                        1 · Documento
                    </p>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {([
                            { type: 39 as const, label: 'Boleta', Icon: FileText, kbd: 'F1' },
                            { type: 33 as const, label: 'Factura', Icon: Building2, kbd: 'F2' },
                            { type: 52 as const, label: 'Guía', Icon: Truck, kbd: 'F3' },
                        ] as const).map(({ type, label, Icon, kbd }) => (
                            <button
                                key={type}
                                onClick={() => {
                                    setDteType(type);
                                    setSelectedCustomer(null);
                                    setCustomerSearch('');
                                    setActiveStep('payment');
                                }}
                                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-xs font-bold transition-all gap-0.5 ${
                                    dteType === type
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
                                <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 px-1 rounded">{kbd}</span>
                            </button>
                        ))}
                    </div>

                    {dteType === 33 && (
                        <div className="relative mt-2">
                            <Input
                                placeholder="Buscar cliente por RUT o nombre..."
                                value={selectedCustomer
                                    ? `${selectedCustomer.name} (${selectedCustomer.rut})`
                                    : customerSearch}
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
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
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
                                <p className="text-xs text-amber-600 mt-1">
                                    Se requiere cliente para emitir Factura
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Customer picker for CREDITO payment (single or mixed) — only shown if dteType !== 33 to avoid duplication */}
                {isCreditPayment && dteType !== 33 && (
                    <div className={`rounded-xl transition-all duration-200 ring-2 ring-amber-400 p-2 bg-amber-50/30 dark:bg-amber-900/10`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-amber-500">
                            Cliente (requerido para Crédito)
                        </p>
                        <div className="relative">
                            <Input
                                placeholder="Buscar cliente por RUT o nombre..."
                                value={selectedCustomer
                                    ? `${selectedCustomer.name} (${selectedCustomer.rut})`
                                    : customerSearch}
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
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
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
                                <p className="text-xs text-amber-600 mt-1">
                                    Se requiere cliente para registrar el crédito
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment mode tabs */}
                <div className={`rounded-xl transition-all duration-200 ${activeStep === 'payment' ? 'ring-2 ring-indigo-400 p-2 bg-indigo-50/30 dark:bg-indigo-900/10' : 'opacity-75'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${activeStep === 'payment' ? 'text-indigo-500' : 'text-slate-400'}`}>
                        2 · Método de Pago
                    </p>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-3">
                        <button
                            onClick={() => setPaymentType('SINGLE')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                paymentType === 'SINGLE'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600'
                                    : 'text-slate-500'
                            }`}
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Único
                        </button>
                        <button
                            onClick={() => setPaymentType('MIXED')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                paymentType === 'MIXED'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600'
                                    : 'text-slate-500'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" /> Mixto
                        </button>
                    </div>

                    {paymentType === 'SINGLE' ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: PaymentMethod.DEBIT, label: 'Débito', Icon: Calculator, kbd: 'F5' },
                                    { id: PaymentMethod.CASH, label: 'Efectivo', Icon: Banknote, kbd: 'F6' },
                                    { id: PaymentMethod.CARD, label: 'Crédito', Icon: CreditCard, kbd: 'F7' },
                                    { id: PaymentMethod.TRANSFER, label: 'Transf.', Icon: RefreshCw, kbd: 'F8' },
                                ].map(({ id, label, Icon, kbd }) => (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            setSingleMethod(id);
                                            setActiveStep('cash');
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                            singleMethod === id
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5 mb-1" />
                                        <span className="text-[10px] font-black uppercase">{label}</span>
                                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-400 px-1 rounded mt-0.5">{kbd}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold uppercase text-slate-400">
                                    Monto Recibido
                                </Label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        ref={cashInputRef}
                                        type="number"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        className={`pl-9 h-10 text-base font-bold transition-all ${
                                            activeStep === 'cash' ? 'ring-2 ring-indigo-400 border-indigo-400' : ''
                                        }`}
                                        placeholder="Ej: 5000"
                                    />
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-xs font-bold uppercase text-slate-400">Vuelto</span>
                                        <span className="text-xl font-black text-amber-500">{formatPrice(change)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {[
                                { id: PaymentMethod.CASH, label: 'Efectivo', Icon: Banknote },
                                { id: PaymentMethod.DEBIT, label: 'Débito', Icon: Calculator },
                                { id: PaymentMethod.CARD, label: 'Crédito', Icon: CreditCard },
                                { id: PaymentMethod.TRANSFER, label: 'Transferencia', Icon: RefreshCw },
                            ].map(({ id, label, Icon }) => (
                                <div key={id} className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                        <Icon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <span className="text-[9px] font-black uppercase text-slate-400 group-focus-within:text-indigo-500">
                                            {label}
                                        </span>
                                    </div>
                                    <Input
                                        type="number"
                                        value={mixedPayments[id] ?? ''}
                                        onChange={(e) => setMixedPayments({
                                            ...mixedPayments,
                                            [id]: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                                        })}
                                        className="pl-28 h-9 font-bold text-right border-slate-200 dark:border-slate-700"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                            <div className="flex justify-between text-xs font-bold pt-1">
                                <span className="text-slate-400">Cubierto</span>
                                <span className={isTotalCovered ? 'text-emerald-500' : 'text-rose-500'}>
                                    {formatPrice(totalMixed)} / {formatPrice(total)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                {paymentType === 'MIXED' && !isTotalCovered && (
                    <Badge
                        variant="outline"
                        className="w-full justify-center border-dashed border-rose-300 text-rose-500 bg-rose-50 dark:bg-rose-900/10 py-1.5 mb-3"
                    >
                        Faltan {formatPrice(remaining)}
                    </Badge>
                )}
                <Button
                    onClick={handleConfirm}
                    disabled={isProcessing || (paymentType === 'MIXED' && !isTotalCovered) || !canConfirm}
                    className={`w-full h-12 text-base font-black tracking-tight rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-[0.98] ${
                        (activeStep === 'confirm' || activeStep === 'cash') && canConfirm ? 'ring-2 ring-offset-2 ring-emerald-400 animate-pulse' : ''
                    }`}
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            PROCESANDO...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            CONFIRMAR PAGO
                            <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded">F12</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
