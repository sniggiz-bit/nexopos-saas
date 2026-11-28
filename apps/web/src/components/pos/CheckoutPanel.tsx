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
import { getSalesMode, openDtePdf, openInternalReceiptPdf } from '@/api/dte-config';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@/api/types';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { useReceiptPrinter } from '@/hooks/useReceiptPrinter';
import { isRealDtePdf } from './receipts/ReceiptRenderer';
import { useTenant } from '@/hooks/useTenant';
import { useDirectPrinter } from '@/hooks/useDirectPrinter';
import './checkout.css';

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
    const { autoPrint, defaultFormat, setDefaultFormat, useWebSerial, columns80, cutPaper, directConnection } = usePrintSettings();
    const { printBytes } = useDirectPrinter();
    const [countdown, setCountdown] = useState(4);
    const [reviewingReceipt, setReviewingReceipt] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { data: tenant } = useTenant(user?.tenantId);
    const receiptPrinter = useReceiptPrinter(defaultFormat, tenant, useWebSerial, printBytes, columns80, cutPaper, directConnection);
    const salesMode = useQuery({ queryKey: ['dte-sales-mode', user?.tenantId], queryFn: () => getSalesMode(), enabled: !!user?.tenantId, staleTime: 0 });
    const internalMode = salesMode.data?.mode === 'internal';

    const [paymentType, setPaymentType] = useState<PaymentType>('SINGLE');
    const [singleMethod, setSingleMethod] = useState<string>(PaymentMethod.DEBIT);
    const [cashReceived, setCashReceived] = useState<string>(total.toString());
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
        if (!isSuccess) { setCountdown(4); setReviewingReceipt(false); return; }
        if (reviewingReceipt || receiptPrinter.status === 'printing' || receiptPrinter.status === 'failed') return;
        if (countdown <= 0) { onBack(); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [isSuccess, countdown, onBack, reviewingReceipt, receiptPrinter.status]);

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

    const canConfirm = salesMode.isSuccess && !salesMode.isFetching && (((!internalMode && dteType === 33) || isCreditPayment) ? !!selectedCustomer : true);

    const handleConfirm = useCallback(async () => {
        if (!canConfirm) return;
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
            const result = await onConfirm(payments, internalMode ? 0 : dteType, customerId);
            if (autoPrint && result) await receiptPrinter.print(result);
        } catch (_err) {
            // Handled in mutation/toast
        } finally {
            setIsSubmitting(false);
        }
    }, [canConfirm, internalMode, selectedCustomer, paymentType, singleMethod, total, dteType, mixedPayments, onConfirm, autoPrint, receiptPrinter.print]);

    useEffect(() => {
        if (isSuccess || isError) return;
        const onKey = (e: KeyboardEvent) => {
            // Allow all shortcuts when in the cash step (even while typing in the input)
            const isInCashStep = activeStep === 'cash';
            const tag = (e.target as HTMLElement).tagName;
            const inInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !isInCashStep;

            if (e.key === 'Escape') { e.preventDefault(); if (!isProcessing && !isSubmitting) onBack(); return; }

            // DTE type — always active → advances to payment step
            if (internalMode && ['F1', 'F2', 'F3'].includes(e.key)) { e.preventDefault(); return; }
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
    }, [internalMode, isSuccess, isError, isProcessing, canConfirm, activeStep, paymentType, isTotalCovered, onBack, handleConfirm]);

    // ── Success state ─────────────────────────────────────────────────────────
    const hasRealDtePdf = !!saleResult?.dteVerifiedAt && !!saleResult?.dteProviderId && !!saleResult?.dteFolio && isRealDtePdf(saleResult?.dtePdfUrl);

    if (isSuccess) {
        return (
            <div className="pos-checkout flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-16 h-16 checkout-raised checkout-positive rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">¡Venta exitosa!</h3>
                        <p className="checkout-muted text-sm mt-1">
                            {receiptPrinter.description}
                        </p>
                    </div>

                    {saleResult?.dteFolio && (
                        <div className="checkout-raised rounded-xl px-6 py-3 text-center">
                            <span className="checkout-muted text-xs block mb-1">Folio DTE</span>
                            <span className="checkout-highlight text-2xl font-black">#{saleResult.dteFolio}</span>
                        </div>
                    )}

                    {hasRealDtePdf && (
                        <Button className="w-full" variant="outline"
                            onClick={() => { setReviewingReceipt(true); openDtePdf('/sales/' + saleResult!.id + '/dte/pdf', defaultFormat).catch(() => toast.error('Venta guardada. No se pudo abrir el PDF oficial. Puedes volver a abrirlo desde Ventas.')); }}>
                            📄 Abrir / Imprimir PDF oficial (con TED)
                        </Button>
                    )}

                    {saleResult?.internalReceiptUrl && (
                        <Button className="w-full" variant="outline"
                            onClick={() => { setReviewingReceipt(true); openInternalReceiptPdf(saleResult!.id).catch(() => toast.error('Venta guardada. No se pudo abrir el ticket interno. Puedes volver a abrirlo desde Ventas.')); }}>
                            Ver Ticket Interno
                        </Button>
                    )}

                    <div className="flex gap-2 w-full">
                        <Button
                            className="flex-1"
                            variant="secondary"
                            disabled={receiptPrinter.status === 'printing'}
                            onClick={() => { setReviewingReceipt(true); void receiptPrinter.print(saleResult); }}
                        >
                            {receiptPrinter.status === 'printing' ? 'Enviando...' : hasRealDtePdf ? useWebSerial && defaultFormat !== 'A4' ? 'Reimprimir boleta' : '🖨 Reimprimir PDF DTE' : 'Reimprimir Ticket'}
                        </Button>
                        {(!hasRealDtePdf || saleResult?.dteType === 39) && (
                            <select
                                aria-label="Formato de impresión"
                                value={defaultFormat}
                                onChange={(e) => setDefaultFormat(e.target.value as '80mm' | '58mm' | 'A4')}
                                className="checkout-input px-2 py-1 text-xs border rounded-lg"
                            >
                                <option value="80mm">80mm</option>
                                <option value="58mm">58mm</option>
                                <option value="A4">A4</option>
                            </select>
                        )}
                    </div>
                </div>

                <div className="p-4 checkout-divider border-t">
                    <Button onClick={onBack} className="w-full" variant="outline">
                        {reviewingReceipt ? 'Cerrar' : `Cerrar (${countdown}s)`}
                    </Button>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (isError) {
        return (
            <div className="pos-checkout flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-16 h-16 checkout-raised checkout-danger rounded-full flex items-center justify-center">
                        <XCircle className="w-9 h-9" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">Error en la venta</h3>
                        <p className="checkout-muted text-sm mt-1">Por favor, intenta nuevamente.</p>
                    </div>
                </div>
                <div className="flex gap-2 p-4 checkout-divider border-t">
                    <Button variant="outline" onClick={onBack} className="flex-1">Cancelar</Button>
                    <Button onClick={handleConfirm}
                        className="checkout-confirm flex-1">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    // ── Checkout form ─────────────────────────────────────────────────────────
    return (
        <div className="pos-checkout flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2 checkout-divider border-b shrink-0">
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    aria-label="Volver al carrito"
                    className="checkout-option grid h-8 w-8 place-items-center rounded-lg border border-transparent disabled:opacity-60"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-base font-bold">
                    Cobro
                </h3>
                <kbd className="checkout-key ml-auto">Esc</kbd>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 checkout-raised checkout-divider border-b shrink-0">
                {([
                    { steps: ['dte'] as Step[], num: 1, label: 'Documento' },
                    { steps: ['payment'] as Step[], num: 2, label: 'Pago' },
                    { steps: ['cash', 'confirm'] as Step[], num: 3, label: activeStep === 'cash' ? 'Monto' : 'Confirmar' },
                ]).map(({ steps, num, label }, i) => {
                    const isActive = steps.includes(activeStep);
                    return (
                        <div key={num} className="flex items-center gap-1">
                            <div className="checkout-step flex items-center gap-1.5" aria-current={isActive ? 'step' : undefined}>
                                <span className="checkout-step-number grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold">{num}</span>
                                <span className="text-[11px] font-semibold">{label}</span>
                            </div>
                            {i < 2 && <ChevronRight className="checkout-muted w-3 h-3" />}
                        </div>
                    );
                })}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">

                {/* Totals summary */}
                <div className="checkout-raised checkout-divider rounded-xl border px-3 py-2.5 space-y-1">
                    <div className="checkout-muted flex justify-between text-xs">
                        <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between checkout-danger text-xs font-medium">
                            <span>Descuento</span><span>−{formatPrice(totalDiscount)}</span>
                        </div>
                    )}
                    <div className="checkout-muted flex justify-between text-xs">
                        <span>IVA (19%)</span><span>{formatPrice(tax)}</span>
                    </div>
                    <div className="checkout-divider flex items-center justify-between gap-2 border-t pt-2">
                        <span className="text-sm font-bold">Total a cobrar</span>
                        <span className="checkout-positive text-2xl font-black tabular-nums">{formatPrice(total)}</span>
                    </div>
                </div>

                {/* DTE selector */}
                <div className="space-y-2">
                    <p className="text-xs font-bold">
                        Documento
                    </p>
                    {salesMode.isFetching && <p className="checkout-muted text-sm" role="status">Consultando modo de venta...</p>}
                    {salesMode.isError && <p role="alert" className="checkout-danger text-sm">No se pudo consultar el modo de venta. <button className="font-semibold underline" onClick={() => salesMode.refetch()}>Reintentar</button></p>}
                    {internalMode ? <p className="checkout-raised checkout-muted rounded-lg px-3 py-2 text-sm font-medium">Comprobante interno · Sin emisión tributaria</p> : salesMode.isSuccess && <div className="checkout-raised flex gap-1 rounded-lg p-1">
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
                                aria-pressed={dteType === type}
                                className="checkout-option flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md border border-transparent py-1.5 text-xs font-semibold"
                            >
                                <div className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
                                <kbd className="checkout-key">{kbd}</kbd>
                            </button>
                        ))}
                    </div>}

                    {!internalMode && dteType === 33 && (
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
                                className="checkout-input text-sm pr-8"
                            />
                            {selectedCustomer && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                                >
                                    <XCircle className="checkout-muted w-4 h-4" />
                                </button>
                            )}
                            {showCustomerDropdown && !selectedCustomer && filteredCustomers.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 checkout-surface checkout-divider border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setShowCustomerDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm checkout-menu-item checkout-divider border-b last:border-0"
                                        >
                                            <div className="font-medium">{c.name}</div>
                                            <div className="checkout-muted text-xs">{c.rut}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!selectedCustomer && (
                                <p className="checkout-warning text-xs mt-1">
                                    Se requiere cliente para emitir Factura
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Customer picker for CREDITO payment (single or mixed) — only shown if dteType !== 33 to avoid duplication */}
                {isCreditPayment && (internalMode || dteType !== 33) && (
                    <div className="checkout-raised checkout-divider rounded-lg border p-2">
                        <p className="checkout-warning mb-2 text-xs font-bold">
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
                                className="checkout-input text-sm pr-8"
                            />
                            {selectedCustomer && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                                >
                                    <XCircle className="checkout-muted w-4 h-4" />
                                </button>
                            )}
                            {showCustomerDropdown && !selectedCustomer && filteredCustomers.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 checkout-surface checkout-divider border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setShowCustomerDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm checkout-menu-item checkout-divider border-b last:border-0"
                                        >
                                            <div className="font-medium">{c.name}</div>
                                            <div className="checkout-muted text-xs">{c.rut}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!selectedCustomer && (
                                <p className="checkout-warning text-xs mt-1">
                                    Se requiere cliente para registrar el crédito
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment mode tabs */}
                <div className="space-y-2">
                    <p className="text-xs font-bold">
                        Método de pago
                    </p>
                    <div className="checkout-raised flex gap-1 rounded-lg p-1">
                        <button
                            onClick={() => setPaymentType('SINGLE')}
                            aria-pressed={paymentType === 'SINGLE'}
                            className="checkout-option flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent py-1.5 text-xs font-semibold"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Único
                        </button>
                        <button
                            onClick={() => setPaymentType('MIXED')}
                            aria-pressed={paymentType === 'MIXED'}
                            className="checkout-option flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent py-1.5 text-xs font-semibold"
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
                                    { id: PaymentMethod.TRANSFER, label: 'Transferencia', Icon: RefreshCw, kbd: 'F8' },
                                ].map(({ id, label, Icon, kbd }) => (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            setSingleMethod(id);
                                            setActiveStep('cash');
                                        }}
                                        aria-pressed={singleMethod === id}
                                        className="checkout-option checkout-method flex min-h-14 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left"
                                    >
                                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                                        <span className="grid min-w-0 gap-0.5">
                                            <span className="text-xs font-bold">{label}</span>
                                            <kbd className="checkout-key w-fit">{kbd}</kbd>
                                        </span>
                                        {singleMethod === id && <CheckCircle2 aria-hidden="true" className="ml-auto h-3.5 w-3.5 shrink-0" />}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="checkout-cash-received" className="text-xs font-bold">
                                    Monto Recibido
                                </Label>
                                <div className="relative">
                                    <Banknote className="checkout-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                                    <Input
                                        ref={cashInputRef}
                                        id="checkout-cash-received"
                                        type="number"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        className="checkout-input pl-9 h-10 text-base font-bold tabular-nums"
                                        placeholder="Ej: 5000"
                                    />
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-xs font-bold">Vuelto</span>
                                        <span className="checkout-positive text-xl font-black tabular-nums">{formatPrice(change)}</span>
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
                                        <Icon className="checkout-muted w-3.5 h-3.5" />
                                        <span className="checkout-muted text-[11px] font-semibold">
                                            {label}
                                        </span>
                                    </div>
                                    <Input
                                        type="number"
                                        aria-label={label}
                                        value={mixedPayments[id] ?? ''}
                                        onChange={(e) => setMixedPayments({
                                            ...mixedPayments,
                                            [id]: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                                        })}
                                        className="checkout-input pl-28 h-9 font-bold tabular-nums text-right"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                            <div className="flex justify-between text-xs font-bold pt-1">
                                <span className="checkout-muted">Cubierto</span>
                                <span className={isTotalCovered ? 'checkout-positive' : 'checkout-danger'}>
                                    {formatPrice(totalMixed)} / {formatPrice(total)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="checkout-surface checkout-divider shrink-0 border-t px-4 py-3">
                {paymentType === 'MIXED' && !isTotalCovered && (
                    <Badge
                        variant="outline"
                        className="checkout-raised checkout-danger checkout-divider w-full justify-center py-1.5 mb-2"
                    >
                        {remaining > 0 ? 'Faltan' : 'Exceso de'} {formatPrice(Math.abs(remaining))}
                    </Badge>
                )}
                <Button
                    onClick={handleConfirm}
                    disabled={isProcessing || (paymentType === 'MIXED' && !isTotalCovered) || !canConfirm}
                    className="checkout-confirm h-12 w-full rounded-lg text-sm font-bold"
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Procesando pago…
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            Confirmar pago
                            <kbd className="checkout-key">F12</kbd>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
