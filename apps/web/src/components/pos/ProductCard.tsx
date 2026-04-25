import { Product } from '@/api/products';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/formatters';
import { Plus } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    viewMode?: 'grid' | 'list';
}

function getStockStyle(stock: number | null | undefined): { label: string; cls: string } {
    if (stock === null || stock === undefined) return { label: '∞', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (stock <= 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700 border-red-200' };
    if (stock <= 5) return { label: `${stock} un.`, cls: 'bg-red-100 text-red-700 border-red-200' };
    if (stock <= 20) return { label: `${stock} un.`, cls: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: `${stock} un.`, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
}

export function ProductCard({ product, onAddToCart, viewMode = 'grid' }: ProductCardProps) {
    const stockInfo = getStockStyle(product.stock);
    const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

    if (viewMode === 'list') {
        return (
            <div
                onClick={() => !isOutOfStock && onAddToCart(product)}
                className={`group flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-200 select-none ${
                    isOutOfStock
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 active:scale-[0.995]'
                }`}
            >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-base font-bold text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                    {product.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">
                        {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {product.brand && (
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                {product.brand.name}
                            </span>
                        )}
                        {product.sku && (
                            <span className="text-[10px] text-slate-400 font-mono">
                                {product.sku}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stock */}
                <Badge variant="outline" className={`${stockInfo.cls} text-[10px] px-2 shrink-0`}>
                    {stockInfo.label}
                </Badge>

                {/* Price */}
                <span className="font-bold text-slate-900 dark:text-white text-sm shrink-0 min-w-[80px] text-right">
                    {formatPrice(product.price)}
                </span>

                {/* Add button */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isOutOfStock
                        ? 'bg-slate-100 text-slate-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                }`}>
                    <Plus className="w-4 h-4" />
                </div>
            </div>
        );
    }

    // Grid mode
    return (
        <div
            onClick={() => !isOutOfStock && onAddToCart(product)}
            className={`group relative flex flex-col p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 overflow-hidden select-none ${
                isOutOfStock
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 active:scale-95'
            }`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-indigo-50/50 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={`${stockInfo.cls} text-[10px] px-2 py-0.5 font-semibold shadow-none`}>
                        {stockInfo.label}
                    </Badge>
                    {product.brand && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[80px]">
                            {product.brand.name}
                        </span>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center mb-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {product.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-center leading-tight line-clamp-2 text-sm min-h-[2.5rem]">
                        {product.name}
                    </h3>
                    {product.sku && (
                        <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
                    )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block leading-none mb-0.5">Precio</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            {formatPrice(product.price)}
                        </span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                        isOutOfStock
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                        <Plus className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
