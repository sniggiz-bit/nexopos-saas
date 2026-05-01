import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/formatters';
import { Minus, Plus, Trash2, Tag } from 'lucide-react';
import { useCart, type CartItemData } from '@/context/CartContext';
import { DiscountModal } from './DiscountModal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CartItemProps {
    item: CartItemData;
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem, applyDiscount } = useCart();
    const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

    const basePrice    = Number(item.price) || 0;
    const baseQuantity = Number(item.quantity) || 0;
    const baseSubtotal = basePrice * baseQuantity;
    let finalSubtotal  = baseSubtotal;
    let discountAmount = 0;

    if (item.discountValue && item.discountType) {
        const dVal = Number(item.discountValue) || 0;
        discountAmount = item.discountType === 'PERCENTAGE'
            ? (baseSubtotal * dVal) / 100
            : dVal;
        finalSubtotal = Math.max(0, baseSubtotal - discountAmount);
    }

    useEffect(() => {
        setLocalQuantity(item.quantity.toString());
    }, [item.quantity]);

    const handleLocalChange = (val: string) => {
        setLocalQuantity(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) updateQuantity(item.productId, num);
    };

    const hasDiscount = discountAmount > 0;
    const hasBulkPrice = item.price !== '' && item.price < item.basePrice;

    return (
        <div className="group flex flex-col p-3 rounded-xl bg-surface-raised border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150">
            {/* Name + subtotal */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm leading-tight mb-1 truncate">
                        {item.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex flex-col">
                            {hasBulkPrice && (
                                <span className="text-[10px] text-muted-foreground line-through leading-none mb-0.5">
                                    {formatPrice(item.basePrice)}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">
                                {formatPrice(basePrice)}{item.unitType === 'WEIGHT' ? ' /kg' : ' /un'}
                            </span>
                        </div>
                        {hasBulkPrice && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-info border-info/30 bg-info-subtle">
                                Mayorista
                            </Badge>
                        )}
                        {hasDiscount && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-success border-success/30 bg-success-subtle">
                                -{item.discountType === 'PERCENTAGE'
                                    ? `${item.discountValue}%`
                                    : formatPrice(Number(item.discountValue) || 0)}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-black text-foreground text-base tabular-nums leading-none">
                        {formatPrice(finalSubtotal)}
                    </span>
                    {(hasDiscount || hasBulkPrice) && (
                        <span className="text-[10px] text-muted-foreground line-through mt-1 tabular-nums">
                            {formatPrice(Number(item.basePrice) * baseQuantity)}
                        </span>
                    )}
                </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between mt-3">
                {/* Quantity control */}
                {item.unitType === 'UNIT' ? (
                    <div className="flex items-center bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, baseQuantity - 1)}
                            disabled={baseQuantity <= 1}
                            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Disminuir cantidad"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold text-foreground tabular-nums select-none">
                            {baseQuantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, baseQuantity + 1)}
                            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Aumentar cantidad"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 bg-background rounded-lg border border-border px-2 py-1 shadow-sm">
                        <input
                            type="number"
                            className="w-16 text-center text-sm font-semibold border-none focus:ring-0 p-0 bg-transparent text-foreground"
                            value={localQuantity}
                            step="0.001"
                            onChange={(e) => handleLocalChange(e.target.value)}
                            onBlur={() => {
                                if (localQuantity === '' || isNaN(parseFloat(localQuantity))) {
                                    setLocalQuantity(item.quantity.toString());
                                }
                            }}
                        />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">kg</span>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-9 w-9 rounded-xl transition-colors',
                            hasDiscount
                                ? 'text-success bg-success-subtle hover:bg-success-subtle/80'
                                : 'text-muted-foreground hover:text-success hover:bg-success-subtle'
                        )}
                        onClick={() => setIsDiscountModalOpen(true)}
                        title="Aplicar descuento"
                    >
                        <Tag className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger-subtle transition-colors"
                        onClick={() => removeItem(item.productId)}
                        title="Eliminar producto"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <DiscountModal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                itemName={item.name}
                itemPrice={(Number(item.price) || 0) * (Number(item.quantity) || 0)}
                currentDiscountType={item.discountType}
                currentDiscountValue={item.discountValue === '' ? undefined : Number(item.discountValue)}
                onApply={(type, value) => applyDiscount(item.productId, type, value)}
            />
        </div>
    );
}
