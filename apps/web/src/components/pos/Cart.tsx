import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Clock, X, BookmarkPlus, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { CartItem } from './CartItem';
import { Badge } from '@/components/ui/badge';
import { PresalesList } from './PresalesList';
import { useQuotes } from '@/hooks/useQuotesQuery';
import { useDeleteQuote, useMarkQuoteAccepted } from '@/hooks/useQuotes';
import { Quote } from '@/api/types';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuote } from '@/api/quotes';
import { useAuth } from '@/context/AuthContext';
import { CheckoutPanel } from './CheckoutPanel';
import { type PaymentRequestData } from '@/api/sales';

interface CartProps {
    onConfirm: (payments: PaymentRequestData[], dteType: number, customerId?: string) => void;
    onCheckoutClose?: () => void;
    isProcessing?: boolean;
    isSuccess?: boolean;
    isError?: boolean;
    saleResult?: any;
}

type Tab = 'cart' | 'presales';

export function Cart({ onConfirm, onCheckoutClose, isProcessing, isSuccess, isError, saleResult }: CartProps) {
    const { items, totals, clearCart, addItem } = useCart();
    const { total, subtotal, totalDiscount, tax } = totals;
    const [activeTab, setActiveTab]     = useState<Tab>('cart');
    const [checkoutMode, setCheckoutMode] = useState(false);
    const { toast }        = useToast();
    const { user }         = useAuth();
    const queryClient      = useQueryClient();

    const { data: quotesData, isLoading: isLoadingQuotes } = useQuotes();
    const quotes        = Array.isArray(quotesData) ? quotesData : [];
    const pendingQuotes = quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT');

    const restoredQuoteIdRef = useRef<string | null>(null);
    const { mutate: deletePresale, isPending: isDeletingPresale, variables: deletingPresaleId } = useDeleteQuote();
    const { mutate: acceptQuote } = useMarkQuoteAccepted();

    // Auto-mark presale as ACCEPTED when sale is paid
    useEffect(() => {
        if (isSuccess && restoredQuoteIdRef.current) {
            const id = restoredQuoteIdRef.current;
            restoredQuoteIdRef.current = null;
            acceptQuote(id);
        }
    }, [isSuccess, acceptQuote]);

    const isEmpty    = items.length === 0;
    const itemCount  = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (checkoutMode) return;
            if (e.key === 'F12') {
                e.preventDefault();
                if (!isEmpty) setCheckoutMode(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [checkoutMode, isEmpty]);

    const { mutate: savePresale, isPending: isSavingPresale } = useMutation({
        mutationFn: () => createQuote({
            tenantId: user!.tenantId,
            userId:   user!.id,
            items: items.map(item => ({
                productId:   item.productId,
                productName: item.name,
                quantity:    Number(item.quantity) || 1,
                price:       Number(item.price) || 0,
            })),
        }),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['quotes', user!.tenantId] });
            toast({ variant: 'success', title: 'Preventa guardada', description: 'El carrito fue guardado como preventa.' });
            clearCart();
            setActiveTab('presales');
        },
        onError: (error: any) => {
            toast({ variant: 'destructive', title: 'Error al guardar preventa', description: error?.response?.data?.message || error?.message || 'No se pudo guardar la preventa.' });
        },
    });

    const handleRestorePresale = (quote: Quote) => {
        if (items.length > 0) {
            if (!confirm('¿Reemplazar carrito actual?')) return;
            clearCart();
        }
        restoredQuoteIdRef.current = quote.id;
        let restored = 0;
        quote.items.forEach(qItem => {
            if (qItem.product) {
                addItem(qItem.product, Number(qItem.quantity) || 1);
                restored++;
            }
        });
        setActiveTab('cart');
        if (restored > 0) {
            toast({ title: 'Preventa restaurada', description: `${restored} producto${restored > 1 ? 's' : ''} cargado${restored > 1 ? 's' : ''} al carrito.` });
        } else {
            toast({ variant: 'destructive', title: 'Sin productos', description: 'No se encontraron productos en esta preventa.' });
        }
    };

    const outerClass = 'relative flex flex-col h-full bg-background border-l border-border shadow-xl overflow-hidden';

    if (checkoutMode) {
        return (
            <div className={outerClass}>
                <CheckoutPanel
                    subtotal={subtotal}
                    totalDiscount={totalDiscount}
                    tax={tax}
                    total={total}
                    onConfirm={onConfirm}
                    onBack={() => { if (!isSuccess) restoredQuoteIdRef.current = null; setCheckoutMode(false); onCheckoutClose?.(); }}
                    isProcessing={isProcessing ?? false}
                    isSuccess={isSuccess ?? false}
                    isError={isError ?? false}
                    saleResult={saleResult}
                />
            </div>
        );
    }

    return (
        <div className={outerClass}>
            {/* ── Tabs ── */}
            <div className="bg-background px-3 pt-3 pb-2 border-b border-border shrink-0">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
                    <TabButton
                        active={activeTab === 'cart'}
                        onClick={() => setActiveTab('cart')}
                        icon={<ShoppingBag className="w-4 h-4" />}
                        label="Venta"
                        badge={items.length > 0 ? items.length : undefined}
                        badgeVariant="success"
                    />
                    <TabButton
                        active={activeTab === 'presales'}
                        onClick={() => {
                            queryClient.refetchQueries({ queryKey: ['quotes', user?.tenantId] });
                            setActiveTab('presales');
                        }}
                        icon={<Clock className="w-4 h-4" />}
                        label="Preventas"
                        badge={pendingQuotes.length > 0 ? pendingQuotes.length : undefined}
                        badgeVariant="primary"
                    />
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'cart' ? (
                    <ScrollArea className="h-full bg-background">
                        <div className="p-3 space-y-2 pb-52">
                            {isEmpty ? <CartEmpty /> : items.map(item => (
                                <CartItem key={item.productId} item={item} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <PresalesList
                        quotes={pendingQuotes}
                        isLoading={isLoadingQuotes}
                        onRestore={handleRestorePresale}
                        onDelete={(id) => deletePresale(id)}
                        deletingId={isDeletingPresale ? deletingPresaleId : null}
                    />
                )}
            </div>

            {/* ── Footer ── */}
            {activeTab === 'cart' && (
                <div className="absolute bottom-0 w-full bg-background border-t border-border p-4 z-20 shadow-[0_-8px_24px_-6px_rgb(0_0_0/0.12)]">
                    {/* Totals */}
                    <div className="space-y-1.5 mb-4">
                        {totalDiscount > 0 && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Subtotal</span>
                                    <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-danger font-semibold">Descuento</span>
                                    <span className="text-sm font-bold text-danger tabular-nums">
                                        −{formatPrice(totalDiscount)}
                                    </span>
                                </div>
                            </>
                        )}
                        {tax > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">IVA (19%)</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {formatPrice(tax)}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-end pt-2 border-t border-border">
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block">
                                    Total
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    IVA incluido · {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
                                </span>
                            </div>
                            <span className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                                {formatPrice(total)}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0 rounded-xl hover:bg-danger-subtle hover:text-danger hover:border-danger/30 transition-all"
                            onClick={() => { if (confirm('¿Vaciar carrito?')) clearCart(); }}
                            disabled={isEmpty}
                            title="Vaciar carrito"
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                            onClick={() => savePresale()}
                            disabled={isEmpty || isSavingPresale || !user?.tenantId}
                            title="Guardar como Preventa"
                        >
                            {isSavingPresale
                                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <BookmarkPlus className="w-4 h-4" />
                            }
                        </Button>

                        <Button
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-150 font-black tracking-widest text-base uppercase"
                            onClick={() => setCheckoutMode(true)}
                            disabled={isEmpty || isProcessing}
                        >
                            COBRAR
                            <span className="ml-2 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded">
                                F12
                            </span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Sub-components ── */

function CartEmpty() {
    return (
        <div className="flex flex-col items-center justify-center h-[45vh] gap-3 select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-foreground/60">Carrito vacío</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Selecciona productos o escanea un código
                </p>
            </div>
        </div>
    );
}

function TabButton({
    active, onClick, icon, label, badge, badgeVariant,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: number;
    badgeVariant: 'success' | 'primary';
}) {
    const badgeCls = badgeVariant === 'success'
        ? 'bg-success-subtle text-success border-0'
        : 'bg-primary/10 text-primary border-0';

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
        >
            {icon}
            <span>{label}</span>
            {badge !== undefined && (
                <Badge className={`ml-0.5 h-5 px-1.5 min-w-[1.25rem] text-[10px] ${badgeCls}`}>
                    {badge}
                </Badge>
            )}
        </button>
    );
}
