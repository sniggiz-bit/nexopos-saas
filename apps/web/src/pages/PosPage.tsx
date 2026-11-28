import { useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '@/api/products';
import { useProductsPOS } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories } from '@/hooks/useCategories';
import { useSale } from '@/hooks/useSale';
import { useOfflinePos } from '@/hooks/useOfflinePos';
import { formatPrice } from '@/utils/formatters';
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
import { Scan, Search, X, LogOut, LayoutGrid, List, ShoppingBag } from 'lucide-react';

export function PosPage() {
    const { items: cartItems, addItem, clearCart, quoteId, customerId: cartCustomerId } = useCart();
    const [saleResult, setSaleResult]               = useState<any>(null);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [viewMode, setViewMode]                   = useState<'grid' | 'list'>('grid');
    const [page, setPage]                           = useState(1);
    const { toast }        = useToast();
    const queryClient      = useQueryClient();
    const { user, token }  = useAuth();
    const branchId         = user?.branchId || '';

    const shiftQuery = useCurrentShift(branchId, true);
    const scope = user && branchId ? JSON.stringify([user.tenantId, branchId, user.id]) : '';
    const cached = useOfflinePos({ scope, token, liveShift: shiftQuery.data,
        shiftCheckedAt: shiftQuery.dataUpdatedAt, shiftError: shiftQuery.error });
    const currentShift = cached.offline ? cached.snapshot?.shift : shiftQuery.data;
    const canCloseShift = !cached.offline && !cached.pending.some(sale => sale.request?.offline.shiftId === currentShift?.id);
    const isLoadingShift = shiftQuery.isLoading;

    const { data: branches = [] } = useQuery<{ id: string; name: string }[]>({
        queryKey: ['branches', user?.tenantId],
        queryFn: async () => { const r = await apiClient.get('/branches'); return r.data; },
        enabled: !!user?.tenantId,
        staleTime: 10 * 60 * 1000,
    });
    const branchName = branches.find(b => b.id === user?.branchId)?.name;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { data: serverCategories = [] } = useCategories();
    const categories = useMemo(() => cached.offline
        ? Array.from(new Map(cached.products.flatMap(product => product.category ? [[product.category.id, product.category] as const] : [])).values())
        : serverCategories, [cached.offline, cached.products, serverCategories]);

    // Server-side paginated product query — re-runs after 300ms debounce
    const { data: productPage, isLoading: loadingOnline } = useProductsPOS({
        search:     debouncedSearch || undefined,
        categoryId: selectedCategoryId || undefined,
        page,
        limit: 50,
    });
    const filteredLocal = useMemo(() => {
        if (!cached.offline || !cached.ready) return [];
        const search = searchKey(debouncedSearch.trim());
        return cached.products.filter(product => (!selectedCategoryId || product.category?.id === selectedCategoryId) &&
            (!search || [product.name, product.sku, product.barcode].some(value => searchKey(value ?? "").includes(search))));
    }, [cached.offline, cached.ready, cached.products, debouncedSearch, selectedCategoryId]);
    const products = cached.offline ? filteredLocal.slice((page - 1) * 50, page * 50) : (productPage?.data ?? []);
    const totalPages = cached.offline ? Math.max(1, Math.ceil(filteredLocal.length / 50)) : (productPage?.totalPages ?? 1);
    const totalItems = cached.offline ? filteredLocal.length : (productPage?.total ?? 0);
    const isLoading = !cached.offline && loadingOnline;

    // Reset to page 1 when search or category changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategoryId, cached.offline]);

    const handleAddToCart = (product: Product) => {
        if (cached.offline && (!cached.ready || product.stock <= 0)) return;
        addItem(product);
    };

    // Barcode scanner — search server-side when scanned code is not in current page
    const addToCartByBarcode = (barcode: string) => {
        const source = cached.offline && cached.ready ? cached.products : products;
        const local = source.find(p => p.barcode === barcode || p.sku === barcode);
        if (local) {
            if (cached.offline && local.stock <= 0) return;
            handleAddToCart(local);
            toast({ title: 'Producto Agregado', description: local.name, duration: 1200 });
            return;
        }
        // Fallback: trigger a server search for the barcode
        setSearchQuery(barcode);
        toast({ description: `Buscando: ${barcode}…`, duration: 1200 });
    };

    useBarcodeScanner({ onScan: addToCartByBarcode, enabled: !isCloseShiftModalOpen });


    const { mutateAsync: createSaleAsync, isPending, isSuccess, isError, reset } = useSale();

    const saleItems = (): CreateSaleRequest['items'] => cartItems.map(item => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const discount = Number(item.discountValue) || 0;
        const discountAmount = item.discountType === 'PERCENTAGE' ? Math.round(price * quantity * discount / 100)
            : item.discountType === 'FIXED' ? Math.round(discount) : 0;
        return { productId: item.productId, quantity, price, discountAmount };
    });

    const offlineTotal = saleItems().reduce((sum, item) => sum + Number(item.price) * item.quantity - Number(item.discountAmount), 0);

    const saveOfflineSale = async (method: string, receiptReference: string, paymentReference: string) => {
        if (!user || !branchId || !cached.snapshot || quoteId || cartCustomerId) {
            throw new Error('Se requiere un turno guardado y una venta directa sin un cliente asociado.');
        }
        const items = saleItems();
        const total = offlineTotal;
        await cached.record({
            tenantId: user.tenantId, branchId, dteType: 0, items,
            payments: [{ paymentMethod: method, amount: total }],
            offline: { id: crypto.randomUUID(), shiftId: cached.snapshot.shift.id, operatorId: user.id,
                recordedAt: new Date().toISOString(), receiptReference: receiptReference || undefined,
                paymentReference: paymentReference || undefined },
        });
        clearCart();
        toast({ title: 'Venta guardada en este equipo', description: 'Se enviará al servidor al recuperar la conexión.' });
        window.dispatchEvent(new Event('nexopos:sync-sales'));
    };

    const handleConfirmPayment = async (payments: PaymentRequestData[], dteType?: number, customerId?: string) => {
        if (!user?.tenantId || !user?.branchId) {
            toast({ variant: 'destructive', title: 'Error de configuración', description: 'No se pudo determinar la sucursal.' });
            throw new Error('Missing branch configuration');
        }
        const saleData: CreateSaleRequest = {
            tenantId: user.tenantId,
            branchId: user.branchId,
            items: cartItems.map((item) => {
                const qty   = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const dVal  = Number(item.discountValue) || 0;
                const discountAmount =
                    item.discountType === 'PERCENTAGE' ? Math.round((price * qty * dVal) / 100)
                    : item.discountType === 'FIXED'    ? dVal
                    : 0;
                return { productId: item.productId, quantity: qty, price, discountAmount };
            }),
            payments,
            dteType,
            customerId: customerId || cartCustomerId || undefined,
            quoteId: quoteId || undefined,
        };
        try {
            const data = await createSaleAsync(saleData);
            cached.trackOnlineSale(data.id, saleData.items);
            setSaleResult(data);
            toast({
                variant: 'success',
                title: '¡Venta Exitosa!',
                description: data.dteFolio ? `Folio: #${data.dteFolio}` : `ID: ${data.id.slice(0, 8)}`,
            });
            clearCart();
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            return data;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error en la Venta',
                description: error.message || 'Ocurrió un error al procesar la venta',
            });
            throw error;
        }
    };

    const inputRef = useRef<HTMLInputElement>(null);

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
        if (e.key === 'Enter' && products.length === 1) {
            handleAddToCart(products[0]);
            setSearchQuery('');
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-muted/30 dark:bg-background overflow-hidden">
            {/* Top bar */}
            <PosUserToolbar currentShift={currentShift} branchName={branchName} />

            {(cached.offline || cached.pending.length > 0 || cached.preparing || cached.ready || cached.storageError) && (
                <div className="shrink-0 border-b bg-card px-5 py-2 text-xs" aria-live="polite">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {cached.offline ? <strong>{cached.ready ? 'Sin conexión · catálogo guardado' : 'Sin conexión · caja sin preparar'}</strong>
                            : <span>{cached.ready ? 'Caja preparada para cortes de conexión' : cached.preparing ? 'Preparando catálogo para cortes de conexión…' : ''}</span>}
                        {cached.storageError && <span className="text-red-600">{cached.storageError}</span>}
                        {cached.syncing && <span>Sincronizando ventas…</span>}
                    </div>
                    {cached.pending.length > 0 && (
                        <details className="mt-1">
                            <summary className="cursor-pointer font-medium">Ventas pendientes ({cached.pending.length}) · se incluyen al sincronizar</summary>
                            <ul className="max-h-36 overflow-y-auto space-y-1 py-1">
                                {cached.pending.map(sale => (
                                    <li key={sale.id} className="flex flex-wrap items-center gap-2">
                                        <span className="tabular-nums">{sale.id.slice(0, 8)} · {formatPrice(sale.request?.payments[0]?.amount ?? 0)}</span>
                                        <span>{sale.request?.offline.receiptReference && 'Documento: ' + sale.request.offline.receiptReference}</span>
                                        <span>{sale.issue ?? 'Guardada en este equipo'}</span>
                                        {sale.status === 'review' && <button type="button" className="underline" disabled={cached.offline}
                                            onClick={() => void cached.retry(sale.id).catch(() => toast({ title: 'No se pudo reintentar la venta', variant: 'destructive' }))}>Reintentar</button>}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Products (70%) ── */}
                <div className="w-[70%] flex flex-col h-full border-r border-border">

                    {/* Header */}
                    <div className="px-5 py-3 bg-card border-b border-border z-10 shrink-0 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">

                            {/* Title + status badges */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="bg-primary p-1.5 rounded-lg shadow-sm shadow-primary/20">
                                    <ShoppingBag className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold text-foreground leading-tight hidden sm:block">
                                        Punto de Venta
                                    </h1>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/30 text-success bg-success-subtle animate-pulse">
                                        <Scan className="w-3 h-3 mr-1" />
                                        Captura
                                    </Badge>
                                    {currentShift && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/30 text-success bg-success-subtle">
                                            Turno Abierto
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Search */}
                            <div className="flex-1 relative flex items-center bg-muted rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-150">
                                <Search className="ml-3 text-muted-foreground w-4 h-4 shrink-0" />
                                <Input
                                    ref={inputRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Buscar producto, código, SKU… (F3)"
                                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-10 text-sm placeholder:text-muted-foreground"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                                        className="mr-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-border transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* View toggle */}
                            <div className="flex items-center gap-0.5 p-1 bg-muted rounded-lg shrink-0 border border-border">
                                <ViewToggleBtn
                                    active={viewMode === 'grid'}
                                    onClick={() => setViewMode('grid')}
                                    title="Vista cuadrícula"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </ViewToggleBtn>
                                <ViewToggleBtn
                                    active={viewMode === 'list'}
                                    onClick={() => setViewMode('list')}
                                    title="Vista lista"
                                >
                                    <List className="w-4 h-4" />
                                </ViewToggleBtn>
                            </div>

                            {/* Close shift */}
                            {currentShift && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={!canCloseShift}
                                    title={!canCloseShift ? 'Conéctate y sincroniza las ventas pendientes para cerrar caja' : undefined}
                                    onClick={() => setIsCloseShiftModalOpen(true)}
                                    className="shrink-0 text-muted-foreground hover:text-danger hover:bg-danger-subtle transition-colors h-9 px-3 rounded-xl"
                                >
                                    <LogOut className="w-4 h-4 mr-1.5" />
                                    <span className="hidden md:inline text-sm">Cerrar Caja</span>
                                </Button>
                            )}
                        </div>

                        {/* Categories + product count */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <CategoryFilter
                                    categories={categories}
                                    selectedCategoryId={selectedCategoryId}
                                    onSelectCategory={setSelectedCategoryId}
                                />
                            </div>
                            {!isLoading && (
                                <span className="text-xs text-muted-foreground shrink-0 font-medium tabular-nums">
                                    {totalItems} producto{totalItems !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-muted/30 dark:bg-background scrollbar-thin">
                        <ProductGrid
                            products={products}
                            isLoading={isLoading}
                            onAddToCart={handleAddToCart}
                            viewMode={viewMode}
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={setPage}
                        />
                    </div>
                </div>

                {/* ── Right: Cart (30%) ── */}
                <div className="w-[30%] h-full z-20">
                    <Cart
                        onConfirm={handleConfirmPayment}
                        onCheckoutClose={() => { reset(); setSaleResult(null); }}
                        isProcessing={isPending}
                        isSuccess={isSuccess}
                        isError={isError}
                        saleResult={saleResult}
                        offline={{ active: cached.offline, ready: cached.ready, fiscal: cached.snapshot?.salesMode === 'fiscal', total: offlineTotal, onSave: saveOfflineSale }}
                    />
                </div>
            </div>

            {/* Modals */}
            <OpenShiftModal isOpen={!cached.offline && !isLoadingShift && !currentShift && !isCloseShiftModalOpen} />
            <CloseShiftModal
                isOpen={isCloseShiftModalOpen && canCloseShift}
                onClose={() => setIsCloseShiftModalOpen(false)}
                shiftId={currentShift?.id ?? ''}
                currentShift={currentShift}
            />
        </div>
    );
}

function searchKey(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function ViewToggleBtn({
    active, onClick, title, children,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={[
                'p-1.5 rounded-md transition-all duration-150',
                active
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
        >
            {children}
        </button>
    );
}
