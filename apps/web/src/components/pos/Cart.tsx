import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, PauseCircle, Clock } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { CartItem } from './CartItem';
import { Badge } from '@/components/ui/badge';
import { PresalesList } from './PresalesList';
import { useQuotes } from '@/hooks/useQuotesQuery';
import { useCreateQuote } from '@/hooks/useQuotes';
import { useAuth } from '@/context/AuthContext';
import { Quote } from '@/api/types';
import { useToast } from '@/hooks/use-toast';

interface CartProps {
    onCheckout: () => void;
    isProcessing?: boolean;
    checkoutLabel?: string;
}

type Tab = 'cart' | 'presales';

export function Cart({ onCheckout, isProcessing, checkoutLabel = 'PAGAR' }: CartProps) {
    const { items, totals, clearCart, addItem, updateQuantity } = useCart();
    const { total } = totals;
    const [activeTab, setActiveTab] = useState<Tab>('cart');
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: quotesData, isLoading: isLoadingQuotes, refetch: refetchQuotes } = useQuotes();
    const quotes = Array.isArray(quotesData) ? quotesData : [];
    const { mutate: saveQuote, isPending: isSavingQuote } = useCreateQuote();

    const isEmpty = items.length === 0;

    const handleSavePresale = () => {
        if (isEmpty) return;

        saveQuote({
            tenantId: user?.tenantId || 'tenant-1',
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            }))
        }, {
            onSuccess: () => {
                clearCart();
                setActiveTab('presales');
                refetchQuotes();
            }
        });
    };

    const handleRestorePresale = (quote: Quote) => {
        if (items.length > 0) {
            if (!confirm('¿Reemplazar carrito actual?')) return;
            clearCart();
        }

        quote.items.forEach(qItem => {
            if (qItem.product) {
                addItem(qItem.product);
                // Force update quantity to matched quoted quantity
                setTimeout(() => {
                    updateQuantity(qItem.product!.id, qItem.quantity);
                }, 0);
            }
        });

        setActiveTab('cart');
        toast({ title: "Preventa restaurada", description: "Los productos han sido agregados al carrito." });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl">
            {/* Tabs Header */}
            <div className="bg-white dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'cart'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Venta Actual
                        {items.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[1.25rem] bg-emerald-100 text-emerald-700">
                                {items.length}
                            </Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('presales')}
                        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'presales'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Preventas
                        {quotes.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[1.25rem] bg-indigo-100 text-indigo-700">
                                {quotes.length}
                            </Badge>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'cart' ? (
                    <ScrollArea className="h-full bg-white dark:bg-slate-800">
                        <div className="p-4 space-y-3 pb-24">
                            {isEmpty ? (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-slate-300 dark:text-slate-600">
                                    <ShoppingCart className="w-20 h-20 mb-4 opacity-20" />
                                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500">Carrito Vacío</p>
                                    <p className="text-sm text-slate-400">Escanea o selecciona productos</p>
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

            {/* Footer Actions - Only visible on Cart Tab */}
            {activeTab === 'cart' && (
                <div className="absolute bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-5 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                    <div className="space-y-4 mb-5">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">SUBTOTAL</span>
                                <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                                    {formatPrice(totals.subtotal)}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL A PAGAR</span>
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                                    {formatPrice(total)}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-medium text-slate-500">Items en carrito: {items.length}</span>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">IVA (19%) INCLUIDO</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-16 border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all duration-300 flex flex-col items-center justify-center gap-1 group"
                            onClick={() => {
                                if (confirm('¿Vaciar carrito?')) clearCart();
                            }}
                            disabled={isEmpty}
                            title="Vaciar Carrito (Esc)"
                        >
                            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Limpiar</span>
                        </Button>

                        <Button
                            className="flex-[3] h-16 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center gap-0.5 text-xl rounded-2xl transition-all duration-300 group"
                            onClick={onCheckout}
                            disabled={isEmpty || isProcessing}
                        >
                            {isProcessing ? (
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="font-bold">PROCESANDO</span>
                                </div>
                            ) : (
                                <>
                                    <span className="font-black tracking-widest text-lg group-hover:tracking-[0.15em] transition-all uppercase">
                                        {checkoutLabel}
                                    </span>
                                    <span className="text-[9px] font-black opacity-60 tracking-widest uppercase mt-[-2px]">
                                        Presiona F12
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
