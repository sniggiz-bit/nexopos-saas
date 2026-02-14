import { Product } from '@/api/products';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/formatters';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const hasStock = product.stock > 0 || product.stock === null;

    // Determine stock status color
    let stockBadgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (product.stock !== null) {
        if (product.stock <= 5) stockBadgeColor = "bg-red-100 text-red-700 border-red-200";
        else if (product.stock <= 20) stockBadgeColor = "bg-amber-100 text-amber-700 border-amber-200";
    }

    return (
        <div
            onClick={() => onAddToCart(product)}
            className="group relative flex flex-col p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden select-none active:scale-95"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={`${stockBadgeColor} text-[10px] px-2 py-0.5 font-semibold shadow-none`}>
                        {product.stock !== null ? `${product.stock} un.` : '∞'}
                    </Badge>
                    {product.brand && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[80px]">
                            {product.brand.name}
                        </span>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center mb-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {product.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-center leading-tight line-clamp-2 text-sm min-h-[2.5rem]">
                        {product.name}
                    </h3>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Precio</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatPrice(product.price)}
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
