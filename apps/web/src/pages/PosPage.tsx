import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '@/api/products';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSale } from '@/hooks/useSale';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CategoryFilter } from '@/components/pos/CategoryFilter';
import { Cart } from '@/components/pos/Cart';
import { PosUserToolbar } from '@/components/pos/PosUserToolbar';
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
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Scan, Search, X, LogOut, LayoutGrid, List, Package } from 'lucide-react';

export function PosPage() {
    const { items: cartItems, addItem, clearCart } = useCart();
    const [saleResult, setSaleResult] = useState<any>(null);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { user } = useAuth();
    const branchId = user?.branchId || '';
    const { data: currentShift, isLoading: isLoadingShift } = useCurrentShift(branchId);

    // Fetch branch name for toolbar
    const { data: branches = [] } = useQuery<{ id: string; name: string }[]>({
        queryKey: ['branches', user?.tenantId],
        queryFn: async () => { const r = await apiClient.get('/branches'); return r.data; },
        enabled: !!user?.tenantId,
        staleTime: 10 * 60 * 1000,
    });
    const branchName = branches.find(b => b.id === user?.branchId)?.name;

    const { data: products = [], isLoading } = useProducts(user?.tenantId);
    const { data: categories = [] } = useCategories(user?.tenantId);

    const { mutate: createSale, isPending, isSuccess, isError, reset } = useSale({
        onSuccess: (data) => {
            setSaleResult(data);
            toast({
                variant: 'success',
                title: '¡Venta Exitosa!',
                description: data.dteFolio ? `Folio: #${data.dteFolio}` : `ID: ${data.id.slice(0, 8)}`,
            });
            clearCart();
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Error en la Venta',
                description: error.message || 'Ocurrió un error al procesar la venta',
            });
        },
    });

    const handleAddToCart = (product: Product) => addItem(product);

    const addToCartByBarcode = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode || p.sku === barcode);
        if (product) {
            addItem(product);
            toast({ title: 'Producto Agregado', description: product.name, duration: 1200 });
        } else {
            toast({ variant: 'destructive', title: 'Código no encontrado', description: barcode });
        }
    };

    useBarcodeScanner({
        onScan: addToCartByBarcode,
        enabled: !isCloseShiftModalOpen,
    });

    const handleConfirmPayment = (payments: PaymentRequestData[], dteType?: number, customerId?: string) => {
        if (!user?.tenantId || !user?.branchId) {
            toast({
                variant: 'destructive',
                title: 'Error de configuración',
                description: 'No se pudo determinar la sucursal.',
            });
            return;
        }

        const saleData: CreateSaleRequest = {
            tenantId: user.tenantId,
            branchId: user.branchId,
            items: cartItems.map((item) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const dVal = Number(item.discountValue) || 0;
                const discountAmount =
                    item.discountType === 'PERCENTAGE' ? Math.round((price * qty * dVal) / 100)
                    : item.discountType === 'FIXED' ? dVal
                    : 0;
                return { productId: item.productId, quantity: qty, price, discountAmount };
            }),
            payments,
            dteType,
            customerId,
        };
        createSale(saleData);
    };

    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (selectedCategoryId) result = result.filter(p => p.category?.id === selectedCategoryId);
        if (searchQuery) {
            const q = searchQuery.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
            result = result.filter(p => {
                const name = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
                return name.includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
            });
        }
        return result;
    }, [products, searchQuery, selectedCategoryId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isCloseShiftModalOpen) return;
            if (e.key === 'F3' || (e.ctrlKey && e.key === 'b')) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape' && document.activeElement !== inputRef.current) {
                if (cartItems.length > 0 && confirm('¿Deseas vaciar el carrito?')) {
                    clearCart();
                    toast({ description: 'Carrito vaciado' });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cartItems, isCloseShiftModalOpen, clearCart, toast]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filteredProducts.length === 1) {
            handleAddToCart(filteredProducts[0]);
            setSearchQuery('');
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* User Toolbar */}
            <PosUserToolbar currentShift={currentShift} branchName={branchName} />

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Products (70%) */}
                <div className="w-[70%] flex flex-col h-full border-r border-slate-200 dark:border-slate-800">
                    {/* Header */}
                    <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 shrink-0">
                        <div className="flex items-center gap-3 mb-3">
                            {/* Title + badges */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md shadow-indigo-200 dark:shadow-none">
                                    <Package className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight hidden sm:block">Punto de Venta</h1>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 animate-pulse">
                                        <Scan className="w-3 h-3 mr-1" />
                                        Captura
                                    </Badge>
                                    {currentShift && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-700 bg-emerald-50">
                                            Turno Abierto
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Search */}
                            <div className="flex-1 relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition duration-300 blur-sm pointer-events-none" />
                                <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <Search className="ml-3 text-slate-400 w-4 h-4 shrink-0" />
                                    <Input
                                        ref={inputRef}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                        placeholder="Buscar producto, código, SKU... (F3)"
                                        className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-10 text-sm placeholder:text-slate-400"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                                            className="mr-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* View toggle */}
                            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Vista en cuadrícula"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Vista en lista"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Close shift */}
                            {currentShift && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCloseShiftModalOpen(true)}
                                    className="shrink-0 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-9 px-3"
                                >
                                    <LogOut className="w-4 h-4 mr-1.5" />
                                    <span className="hidden md:inline text-sm">Cerrar Caja</span>
                                </Button>
                            )}
                        </div>

                        {/* Category pills + product count */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <CategoryFilter
                                    categories={categories}
                                    selectedCategoryId={selectedCategoryId}
                                    onSelectCategory={setSelectedCategoryId}
                                />
                            </div>
                            {!isLoading && (
                                <span className="text-xs text-slate-400 shrink-0 font-medium">
                                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                        <ProductGrid
                            products={filteredProducts}
                            isLoading={isLoading}
                            onAddToCart={handleAddToCart}
                            viewMode={viewMode}
                        />
                    </div>
                </div>

                {/* Right: Cart (30%) */}
                <div className="w-[30%] h-full z-20">
                    <Cart
                        onConfirm={handleConfirmPayment}
                        onCheckoutClose={() => { reset(); setSaleResult(null); }}
                        isProcessing={isPending}
                        isSuccess={isSuccess}
                        isError={isError}
                        saleResult={saleResult}
                    />
                </div>
            </div>

            {/* Modals */}
            <OpenShiftModal isOpen={!isLoadingShift && !currentShift} />

            {currentShift && (
                <CloseShiftModal
                    isOpen={isCloseShiftModalOpen}
                    onClose={() => setIsCloseShiftModalOpen(false)}
                    shiftId={currentShift.id}
                    currentShift={currentShift}
                />
            )}

        </div>
    );
}
