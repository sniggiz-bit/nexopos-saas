import type { ReactNode } from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../../api/types';

export const CATALOG_HEADER_CLASS = 'bg-muted px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400';
export const CATALOG_ROW_CLASS = 'border-b border-border transition-colors last:border-b-0 even:bg-muted/40 hover:bg-cyan-500/[0.04]';

export function CatalogProductIdentity({ product }: { product: Pick<Product, 'name' | 'sku' | 'image'> }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-700 dark:text-cyan-500">
                {product.image ? (
                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                ) : (
                    <Package className="h-4 w-4" aria-hidden="true" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words font-semibold leading-snug text-foreground" title={product.name}>
                    {product.name}
                </p>
                {product.sku && (
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground dark:text-slate-400" title={product.sku}>
                        SKU: {product.sku}
                    </p>
                )}
            </div>
        </div>
    );
}

export function CatalogUnitBadge({ unitType }: { unitType: Product['unitType'] }) {
    const isWeight = unitType === 'WEIGHT';
    const color = isWeight
        ? 'border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300'
        : 'border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-800 dark:text-cyan-300';

    return (
        <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${color}`}>
            {isWeight ? 'Granel' : 'Unidad'}
        </span>
    );
}

const actionColors = {
    cyan: 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-800 hover:bg-cyan-500/[0.18] dark:text-cyan-300',
    violet: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-800 hover:bg-violet-500/[0.18] dark:text-violet-300',
    red: 'border-red-500/20 bg-red-500/[0.08] text-red-700 hover:bg-red-500/[0.18] dark:text-red-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-800 hover:bg-emerald-500/[0.18] dark:text-emerald-400',
};

export function CatalogRowAction({ onClick, tone, label, disabled, children }: {
    onClick: () => void;
    tone: keyof typeof actionColors;
    label: string;
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${actionColors[tone]}`}
        >
            {children}
        </button>
    );
}
