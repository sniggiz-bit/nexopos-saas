import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '@/api/products';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSale } from '@/hooks/useSale';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CategoryFilter } from '@/components/pos/CategoryFilter';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { CreateSaleRequest, PaymentRequestData } from '@/api/sales';
import { useToast } from '@/hooks/use-toast';
import { useCurrentShift } from '@/hooks/useShifts';
import { OpenShiftModal } from '@/components/pos/OpenShiftModal';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Scan, Search, X, LogOut, Package } from 'lucide-react';

export function PosPage() {
    const { items: cartItems, addItem, totals, clearCart } = useCart();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [saleResult, setSaleResult] = useState<any>(null);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { user } = useAuth();
    const branchId = user?.branchId || '';
    const { data: currentShift, isLoading: isLoadingShift } = useCurrentShift(branchId);

    const { data: products = [], isLoading } = useProducts(user?.tenantId);
    const { data: categories = [] } = useCategories(user?.tenantId);

    const { mutate: createSale, isPending, isSuccess, isError, reset } = useSale({
        onSuccess: (data) => {
            setSaleResult(data);
            toast({
                variant: 'success',
                title: '¡Venta Exitosa!',
                description: data.dteFolio
                    ? `Folio: #${data.dteFolio}`
                    : `Venta ID: ${data.id}`,
            });

            clearCart();
            queryClient.invalidateQueries({ queryKey: ['products'] });

            const hasDocument = data.dtePdfUrl || data.internalReceiptUrl;
            setTimeout(() => {
                setIsPaymentModalOpen(false);
                reset();
                setSaleResult(null);
            }, hasDocument ? 10000 : 2000);
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Error en la Venta',
                description: error.message || 'Ocurrió un error al procesar la venta',
            });
        },
    });

    const handleAddToCart = (product: Product) => {
        addItem(product);
    };

    const addToCartByBarcode = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode || p.sku === barcode);
        if (product) {
            addItem(product);
            toast({
                title: 'Producto Agregado',
                description: `${product.name} agregado al carrito`,
                duration: 1500,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Producto No Encontrado',
                description: `No hay producto con el código: ${barcode}`,
            });
        }
    };

    useBarcodeScanner({
        onScan: addToCartByBarcode,
        enabled: !isPaymentModalOpen && !isCloseShiftModalOpen,
    });

    const handleCheckout = () => {
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = (payments: PaymentRequestData[]) => {
        // Guard: ensure we have a valid session with branch/tenant before persisting
        if (!user?.tenantId || !user?.branchId) {
            toast({
                variant: 'destructive',
                title: 'Error de configuración',
                description: 'No se pudo determinar la sucursal. Por favor cierra sesión y vuelve a ingresar.',
            });
            return;
        }

        const saleData: CreateSaleRequest = {
            tenantId: user.tenantId,
            branchId: user.branchId,
            items: cartItems.map((item) => {
                const qty     = Number(item.quantity)     || 0;
                const price   = Number(item.price)        || 0;
                const dVal    = Number(item.discountValue) || 0;

                // Compute total discount CLP for this line
                const discountAmount =
                    item.discountType === 'PERCENTAGE'
                        ? Math.round((price * qty * dVal) / 100)
                        : item.discountType === 'FIXED'
                            ? dVal
                            : 0;

                return {
                    productId: item.productId,
                    quantity: qty,
                    price,            // forward custom / wholesale price
                    discountAmount,   // forward computed line discount
                };
            }),
            payments,
        };

        createSale(saleData);
    };

    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Search Logic
    const filteredProducts = useMemo(() => {
        let result = products;

        if (selectedCategoryId) {
            result = result.filter(p => p.category?.id === selectedCategoryId);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            result = result.filter((product) => {
                const name = product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const barcode = product.barcode?.toLowerCase() || '';
                const sku = product.sku?.toLowerCase() || '';
                const brand = product.brand?.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

                return name.includes(query) ||
                    barcode.includes(query) ||
                    sku.includes(query) ||
                    brand.includes(query);
            });
        }

        return result;
    }, [products, searchQuery, selectedCategoryId]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent shortcuts if modal is open
            if (isPaymentModalOpen || isCloseShiftModalOpen) return;

            // F3 or Ctrl+B - Focus Search
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'b')) {
                e.preventDefault();
                inputRef.current?.focus();
            }

            // F12 - Checkout
            if (e.key === 'F12') {
                e.preventDefault();
                if (cartItems.length > 0) {
                    handleCheckout();
                } else {
                    toast({
                        title: 'Carrito Vacío',
                        description: 'Agrega productos antes de cobrar',
                        variant: 'default'
                    });
                }
            }

            // Esc - Clear Cart (only if search is NOT focused)
            if (e.key === 'Escape' && document.activeElement !== inputRef.current) {
                if (cartItems.length > 0) {
                    if (confirm('¿Deseas vaciar el carrito actual?')) {
                        clearCart();
                        toast({ description: 'Carrito vaciado' });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cartItems, isPaymentModalOpen, isCloseShiftModalOpen, clearCart, toast]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (filteredProducts.length === 1) {
                handleAddToCart(filteredProducts[0]);
                setSearchQuery('');
            }
        }
    };

    const { total, tax, subtotal, totalDiscount } = totals;

    return (
        <div className="h-screen w-full flex bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Left side - Product Grid (70%) */}
            <div className="w-[70%] flex flex-col h-full border-r border-slate-200 dark:border-slate-800">
                {/* Header Section */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
                    <div className="flex justify-between items-center mb-4 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Punto de Venta</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 animate-pulse">
                                        <Scan className="w-3 h-3 mr-1" />
                                        Captura Activa
                                    </Badge>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {currentShift ? `Turno #${currentShift.id}` : 'Caja Cerrada'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-lg mx-auto relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
                            <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <Search className="ml-3 text-slate-400 w-5 h-5" />
                                <Input
                                    ref={inputRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Buscar por nombre, código o SKU (F3)"
                                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-11 text-base placeholder:text-slate-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            inputRef.current?.focus();
                                        }}
                                        className="mr-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {currentShift && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCloseShiftModalOpen(true)}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Salir
                            </Button>
                        )}
                    </div>

                    {/* Category Pills */}
                    <div className="">
                        <CategoryFilter
                            categories={categories}
                            selectedCategoryId={selectedCategoryId}
                            onSelectCategory={setSelectedCategoryId}
                        />
                    </div>
                </div>

                {/* Scrollable Product Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                    <ProductGrid
                        products={filteredProducts}
                        isLoading={isLoading}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </div>

            {/* Right side - Cart (30%) */}
            <div className="w-[30%] h-full z-20">
                <Cart
                    onCheckout={handleCheckout}
                    isProcessing={isPending}
                />
            </div>

            {/* Modals */}
            <OpenShiftModal isOpen={!isLoadingShift && !currentShift} />

            {currentShift && (
                <CloseShiftModal
                    isOpen={isCloseShiftModalOpen}
                    onClose={() => setIsCloseShiftModalOpen(false)}
                    shiftId={currentShift.id}
                />
            )}

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    reset();
                }}
                onConfirm={handleConfirmPayment}
                items={cartItems}
                subtotal={subtotal}
                totalDiscount={totalDiscount}
                tax={tax}
                total={total}
                isProcessing={isPending}
                isSuccess={isSuccess}
                isError={isError}
                saleResult={saleResult}
            />
        </div>
    );
}

