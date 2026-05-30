import { Product } from '@/api/products';
import { ProductCard } from './ProductCard';
import { Package2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGridProps {
    products: Product[];
    isLoading: boolean;
    onAddToCart: (product: Product) => void;
    viewMode?: 'grid' | 'list';
    // Pagination
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
}

function ProductSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
    if (viewMode === 'list') {
        return (
            <div className="animate-pulse flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
            </div>
        );
    }

    return (
        <div className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex justify-between mb-3">
                <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-700 mb-3" />
            <div className="flex justify-between items-center">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
        </div>
    );
}

export function ProductGrid({
    products,
    isLoading,
    onAddToCart,
    viewMode = 'grid',
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
}: ProductGridProps) {
    const showPagination = totalPages !== undefined && totalPages > 1 && onPageChange;

    if (isLoading) {
        return (
            <div className={viewMode === 'grid'
                ? 'grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4'
                : 'flex flex-col gap-2'
            }>
                {Array.from({ length: viewMode === 'grid' ? 12 : 8 }).map((_, i) => (
                    <ProductSkeleton key={i} viewMode={viewMode} />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-slate-400">
                <Package2 className="w-16 h-16 opacity-20" />
                <div className="text-center">
                    <p className="font-semibold text-slate-500">Sin resultados</p>
                    <p className="text-sm">No hay productos que coincidan con tu búsqueda</p>
                </div>
            </div>
        );
    }

    const grid = viewMode === 'list' ? (
        <div className="flex flex-col gap-2">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    viewMode="list"
                />
            ))}
        </div>
    ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    viewMode="grid"
                />
            ))}
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {grid}

            {showPagination && (
                <div className="flex items-center justify-between pt-2 pb-1 px-1 border-t border-border">
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {totalItems !== undefined && (
                            <>Total: <span className="font-medium text-foreground">{totalItems}</span> productos</>
                        )}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            id="pos-products-prev-page"
                            onClick={() => onPageChange(currentPage! - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Página anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="text-xs font-medium text-foreground px-2 tabular-nums">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            id="pos-products-next-page"
                            onClick={() => onPageChange(currentPage! + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Página siguiente"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

