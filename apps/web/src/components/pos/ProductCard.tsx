import { useState } from 'react';
import { Product } from '@/api/products';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/formatters';
import { Check, Plus } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    viewMode?: 'grid' | 'list';
}

function getStockStyle(stock: number | null | undefined): { label: string; cls: string } {
    if (stock === null || stock === undefined) return { label: '∞', cls: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600' };
    if (stock <= 0)  return { label: 'Sin stock', cls: 'bg-danger-subtle text-danger border-danger/20 dark:border-danger/30' };
    if (stock <= 5)  return { label: `${stock} un.`, cls: 'bg-danger-subtle text-danger border-danger/20 dark:border-danger/30' };
    if (stock <= 20) return { label: `${stock} un.`, cls: 'bg-warning-subtle text-warning-700 border-warning/30 dark:text-warning dark:border-warning/30' };
    return { label: `${stock} un.`, cls: 'bg-success-subtle text-success border-success/20 dark:border-success/30' };
}

export function ProductCard({ product, onAddToCart, viewMode = 'grid' }: ProductCardProps) {
    const [added, setAdded] = useState(false);
    const stockInfo = getStockStyle(product.stock);
    const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

    const handleAdd = () => {
        if (isOutOfStock || added) return;
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 380);
    };

    if (viewMode === 'list') {
        return (
            <div
                onClick={handleAdd}
                className={[
                    'group flex items-center gap-3 px-4 py-2.5',
                    'bg-card rounded-xl border transition-all duration-150 select-none shadow-sm',
                    added
                        ? 'border-success/50 animate-flash-border cursor-pointer'
                        : isOutOfStock
                        ? 'border-border opacity-50 cursor-not-allowed'
                        : 'border-border cursor-pointer hover:border-primary/40 hover:shadow-md active:scale-[0.995]',
                ].join(' ')}
            >
                {/* Avatar */}
                <div className={[
                    'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors duration-150 overflow-hidden',
                    added
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                ].join(' ')}>
                    {added ? (
                        <Check className="w-4 h-4" />
                    ) : product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        product.name.charAt(0).toUpperCase()
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate leading-tight">
                        {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {product.brand && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                {product.brand.name}
                            </span>
                        )}
                        {product.sku && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {product.sku}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stock badge */}
                <Badge variant="outline" className={`${stockInfo.cls} text-[10px] px-1.5 py-0 font-semibold shrink-0`}>
                    {stockInfo.label}
                </Badge>

                {/* Price */}
                <span className="font-black text-foreground text-base tabular-nums shrink-0 min-w-[80px] text-right leading-none">
                    {formatPrice(product.price)}
                </span>

                {/* Add button */}
                <div className={[
                    'rounded-lg flex items-center justify-center shrink-0 transition-all duration-150',
                    added
                        ? 'w-9 h-9 bg-success text-white'
                        : isOutOfStock
                        ? 'h-9 px-2 bg-muted text-muted-foreground/50 font-bold text-[10px]'
                        : 'w-9 h-9 bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white',
                ].join(' ')}>
                    {added ? <Check className="w-4 h-4" /> : isOutOfStock ? 'AGOTADO' : <Plus className="w-4 h-4" />}
                </div>
            </div>
        );
    }

    /* ── Grid mode ── */
    return (
        <div
            onClick={handleAdd}
            className={[
                'group relative flex flex-col p-2 rounded-xl border transition-all duration-150 overflow-hidden select-none',
                'bg-card shadow-sm',
                added
                    ? 'border-success/60 shadow-[0_0_0_2px_hsl(142_72%_40%/0.2)] cursor-pointer'
                    : isOutOfStock
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : 'border-border shadow-sm cursor-pointer hover:shadow-card-hover hover:border-primary/40 active:scale-[0.97]',
            ].join(' ')}
        >
            {/* Hover gradient overlay */}
            {!isOutOfStock && (
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl" />
            )}

            <div className="relative z-10 flex flex-col h-full gap-1">
                {/* Top: stock + brand */}
                <div className="flex justify-between items-center gap-1">
                    <Badge
                        variant="outline"
                        className={`${stockInfo.cls} text-[8px] px-1 py-0 font-semibold border leading-3`}
                    >
                        {stockInfo.label}
                    </Badge>
                    {product.brand && (
                        <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-[55px] text-right leading-3">
                            {product.brand.name}
                        </span>
                    )}
                </div>

                {/* Center: avatar/image + name + sku */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1 py-0.5">
                    {product.image ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={[
                            'w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all duration-200',
                            added
                                ? 'bg-success/10 border-success/30 text-success animate-pop-add'
                                : 'bg-surface-raised border-border text-muted-foreground group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary',
                        ].join(' ')}>
                            {added ? <Check className="w-3 h-3" /> : product.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <h3 className="font-semibold text-foreground text-center leading-tight line-clamp-2 text-[11px] min-h-[1.5rem] w-full mt-0.5">
                        {product.name}
                    </h3>

                    {product.sku && (
                        <span className="text-[8px] text-muted-foreground font-mono tracking-tight leading-none">
                            {product.sku}
                        </span>
                    )}
                </div>

                {/* Bottom: price + add button */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="text-xs font-black text-foreground tabular-nums leading-none">
                        {formatPrice(product.price)}
                    </span>

                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleAdd(); }}
                        disabled={isOutOfStock}
                        aria-label={`Agregar ${product.name} al carrito`}
                        className={[
                            'h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0',
                            added
                                ? 'w-7 bg-success text-white scale-95'
                                : isOutOfStock
                                ? 'px-1.5 bg-muted text-muted-foreground/60 cursor-not-allowed text-[8px] font-bold uppercase tracking-wider'
                                : 'w-7 bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white active:scale-90',
                        ].join(' ')}
                    >
                        {added ? <Check className="w-3 h-3" /> : isOutOfStock ? 'AGOT' : <Plus className="w-3 h-3" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
