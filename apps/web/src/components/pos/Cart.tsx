import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Clock, X, BookmarkPlus, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { CartItem } from './CartItem';
import { Badge } from '@/components/ui/badge';
import { PresalesList } from './PresalesList';
import { useQuotes } from '@/hooks/useQuotesQuery';
import { Quote } from '@/api/types';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuote } from '@/api/quotes';
import { useAuth } from '@/context/AuthContext';

interface CartProps {
    onCheckout: () => void;
    isProcessing?: boolean;
    checkoutLabel?: string;
}

type Tab = 'cart' | 'presales';

export function Cart({ onCheckout, isProcessing, checkoutLabel = 'COBRAR' }: CartProps) {
    const { items, totals, clearCart, addItem, updateQuantity } = useCart();
    const { total, subtotal, totalDiscount } = totals;
    const [activeTab, setActiveTab] = useState<Tab>('cart');
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: quotesData, isLoading: isLoadingQuotes } = useQuotes();
    const quotes = Array.isArray(quotesData) ? quotesData : [];
    const pendingQuotes = quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT');

    const isEmpty = items.length === 0;
    const itemCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

    const { mutate: savePresale, isPending: isSavingPresale } = useMutation({
        mutationFn: () => createQuote({
            tenantId: user!.tenantId,
            userId: user!.id,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.name,
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0,
            })),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast({ variant: 'success', title: 'Preventa guardada', description: 'El carrito fue guardado como preventa.' });
            clearCart();
            setActiveTab('presales');
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la preventa.' });
        },
    });

    const handleRestorePresale = (quote: Quote) => {
        if (items.length > 0) {
            if (!confirm('¿Reemplazar carrito actual?')) return;
            clearCart();
        }
        quote.items.forEach(qItem => {
            if (qItem.product) {
                addItem(qItem.product);
                setTimeout(() => {
                    updateQuantity(qItem.product!.id, qItem.quantity);
                }, 0);
            }
        });
        setActiveTab('cart');
        toast({ title: 'Preventa restaurada', description: 'Los productos han sido cargados al carrito.' });
    };

    return (
        <div className="relative flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Tabs Header */}
            <div className="bg-white dark:bg-slate-800 px-3 pt-3 pb-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'cart'
                                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Venta</span>
                        {items.length > 0 && (
                            <Badge className="ml-0.5 h-5 px-1.5 min-w-[1.25rem] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-[10px]">
                                {items.length}
                            </Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('presales')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'presales'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>Preventas</span>
                        {pendingQuotes.length > 0 && (
                            <Badge className="ml-0.5 h-5 px-1.5 min-w-[1.25rem] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border-0 text-[10px]">
                                {pendingQuotes.length}
                            </Badge>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'cart' ? (
                    <ScrollArea className="h-full bg-white dark:bg-slate-800">
                        <div className="p-3 space-y-2 pb-52">
                            {isEmpty ? (
                                <div className="flex flex-col items-center justify-center h-[45vh] text-slate-300 dark:text-slate-600">
                                    <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-base font-semibold text-slate-400 dark:text-slate-500">Carrito vacío</p>
                                    <p className="text-xs text-slate-400 mt-1">Escanea o selecciona productos</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <CartItem key={item.productId} item={item} />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                ) : (
                    <PresalesList
                        quotes={quotes}
                        isLoading={isLoadingQuotes}
                        onRestore={handleRestorePresale}
                    />
                )}
            </div>

            {/* Footer - Cart Tab */}
            {activeTab === 'cart' && (
                <div className="absolute bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 z-20 shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.15)]">
                    {/* Totals */}
                    <div className="space-y-2 mb-4">
                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Subtotal</span>
                                <span className="text-sm font-semibold text-slate-500">{formatPrice(subtotal)}</span>
                            </div>
                        )}
                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-rose-500 font-semibold">Descuento</span>
                                <span className="text-sm font-bold text-rose-600">−{formatPrice(totalDiscount)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-end pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total</span>
                                <span className="text-[10px] text-slate-400">IVA incluido · {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}</span>
                            </div>
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {formatPrice(total)}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        {/* Clear cart */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0 border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 transition-all rounded-xl"
                            onClick={() => { if (confirm('¿Vaciar carrito?')) clearCart(); }}
                            disabled={isEmpty}
                            title="Vaciar carrito"
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        {/* Save as presale */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-900/20 transition-all rounded-xl"
                            onClick={() => savePresale()}
                            disabled={isEmpty || isSavingPresale || !user?.tenantId}
                            title="Guardar como Preventa"
                        >
                            {isSavingPresale
                                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <BookmarkPlus className="w-4 h-4" />
                            }
                        </Button>

                        {/* Checkout */}
                        <Button
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-lg shadow-emerald-500/20 rounded-xl transition-all duration-200 font-black tracking-widest text-base uppercase"
                            onClick={onCheckout}
                            disabled={isEmpty || isProcessing}
                        >
                            {isProcessing ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Procesando</span>
                                </div>
                            ) : checkoutLabel}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
