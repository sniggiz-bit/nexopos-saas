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
    const { updateQuantity, removeItem, applyDiscount, items } = useCart();
    const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

    useEffect(() => {
        setLocalQuantity(item.quantity.toString());
    }, [item.quantity]);

    const basePrice    = Number(item.price) || 0;
    const baseQuantity = Number(item.quantity) || 0;
    const baseSubtotal = basePrice * baseQuantity;
    let finalSubtotal  = baseSubtotal;
    let discountAmount = 0;

    const cartCount = items.length;
    const isCompact = cartCount === 4 || cartCount === 5;
    const isUltraCompact = cartCount >= 6;

    if (item.discountValue && item.discountType) {
        const dVal = Number(item.discountValue) || 0;
        discountAmount = item.discountType === 'PERCENTAGE'
            ? (baseSubtotal * dVal) / 100
            : dVal;
        finalSubtotal = Math.max(0, baseSubtotal - discountAmount);
    }

    const handleLocalChange = (val: string) => {
        setLocalQuantity(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) updateQuantity(item.productId, num);
    };

    const hasDiscount = discountAmount > 0;
    const hasBulkPrice = item.price !== '' && item.price < item.basePrice;

    // Stage 3: Ultra Compact Single-Row Layout (>= 6 items in cart)
    if (isUltraCompact) {
        return (
            <div className="group flex items-center justify-between p-1.5 px-2 rounded-lg bg-surface-raised border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150 gap-2">
                {/* Left side: quantity controls + item name */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {/* Quantity Controls (Mini) */}
                    {item.unitType === 'UNIT' ? (
                        <div className="flex items-center bg-background rounded-lg border border-border overflow-hidden shrink-0">
                            <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, baseQuantity - 1)}
                                disabled={baseQuantity <= 1}
                                className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="w-5 text-center text-[10px] font-bold text-foreground tabular-nums select-none">
                                {baseQuantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, baseQuantity + 1)}
                                className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <Plus className="h-2.5 w-2.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center bg-background rounded-lg border border-border px-1 py-0 shadow-sm shrink-0">
                            <input
                                type="number"
                                className="w-9 text-center text-[10px] font-semibold border-none focus:ring-0 p-0 bg-transparent text-foreground"
                                value={localQuantity}
                                step="0.001"
                                onChange={(e) => handleLocalChange(e.target.value)}
                                onBlur={() => {
                                    if (localQuantity === '' || isNaN(parseFloat(localQuantity))) {
                                        setLocalQuantity(item.quantity.toString());
                                    }
                                }}
                            />
                            <span className="text-[8px] text-muted-foreground font-bold uppercase ml-0.5">kg</span>
                        </div>
                    )}

                    {/* Name */}
                    <span className="font-semibold text-foreground text-[11px] truncate leading-none flex-1">
                        {item.name}
                    </span>
                </div>

                {/* Right side: prices + actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right flex items-center gap-1.5">
                        {hasDiscount && (
                            <span className="text-[8px] text-success font-bold px-1 py-0.25 border border-success/20 bg-success-subtle/50 rounded leading-none shrink-0">
                                -{item.discountType === 'PERCENTAGE'
                                    ? `${item.discountValue}%`
                                    : formatPrice(Number(item.discountValue) || 0)}
                            </span>
                        )}
                        <span className="font-black text-foreground text-[11px] tabular-nums leading-none">
                            {formatPrice(finalSubtotal)}
                        </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'h-6 w-6 rounded-md transition-colors shrink-0 p-0',
                                hasDiscount ? 'text-success bg-success-subtle' : 'text-muted-foreground hover:text-success'
                            )}
                            onClick={() => setIsDiscountModalOpen(true)}
                            title="Descuento"
                        >
                            <Tag className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-danger shrink-0 p-0"
                            onClick={() => removeItem(item.productId)}
                            title="Eliminar"
                        >
                            <Trash2 className="h-2.5 w-2.5" />
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

    // Stage 1 & 2: Standard & Compact Layout (1-3 and 4-5 items in cart)
    return (
        <div className={cn(
            "group flex flex-col rounded-xl bg-surface-raised border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150",
            isCompact ? "p-2 gap-1.5" : "p-3 gap-3"
        )}>
            {/* Name + subtotal */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className={cn(
                        "font-semibold text-foreground leading-tight truncate",
                        isCompact ? "text-xs mb-0.5" : "text-sm mb-1"
                    )}>
                        {item.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1">
                        <div className="flex flex-col">
                            {hasBulkPrice && (
                                <span className={cn(
                                    "text-muted-foreground line-through leading-none mb-0.5",
                                    isCompact ? "text-[8px]" : "text-[10px]"
                                )}>
                                    {formatPrice(item.basePrice)}
                                </span>
                            )}
                            <span className={cn(
                                "text-muted-foreground font-medium",
                                isCompact ? "text-[10px]" : "text-xs"
                            )}>
                                {formatPrice(basePrice)}{item.unitType === 'WEIGHT' ? ' /kg' : ' /un'}
                            </span>
                        </div>
                        {hasBulkPrice && (
                            <Badge variant="outline" className="h-4 px-1 text-info border-info/30 bg-info-subtle font-semibold leading-none text-[10px]">
                                Mayorista
                            </Badge>
                        )}
                        {hasDiscount && (
                            <Badge variant="outline" className="h-4 px-1 text-success border-success/30 bg-success-subtle font-semibold leading-none text-[10px]">
                                -{item.discountType === 'PERCENTAGE'
                                    ? `${item.discountValue}%`
                                    : formatPrice(Number(item.discountValue) || 0)}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                    <span className={cn(
                        "font-black text-foreground tabular-nums leading-none",
                        isCompact ? "text-sm" : "text-base"
                    )}>
                        {formatPrice(finalSubtotal)}
                    </span>
                    {(hasDiscount || hasBulkPrice) && (
                        <span className="text-muted-foreground line-through mt-0.5 tabular-nums leading-none text-[10px]">
                            {formatPrice(Number(item.basePrice) * baseQuantity)}
                        </span>
                    )}
                </div>
            </div>

            {/* Controls row */}
            <div className={cn("flex items-center justify-between", isCompact ? "mt-1.5" : "mt-2")}>
                {/* Quantity control */}
                {item.unitType === 'UNIT' ? (
                    <div className="flex items-center bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, baseQuantity - 1)}
                            disabled={baseQuantity <= 1}
                            className={cn(
                                "flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors",
                                isCompact ? "w-8 h-8" : "w-9 h-9"
                            )}
                            aria-label="Disminuir cantidad"
                        >
                            <Minus className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                        </button>
                        <span className={cn(
                            "text-center font-bold text-foreground tabular-nums select-none",
                            isCompact ? "w-8 text-xs" : "w-9 text-sm"
                        )}>
                            {baseQuantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, baseQuantity + 1)}
                            className={cn(
                                "flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                                isCompact ? "w-8 h-8" : "w-9 h-9"
                            )}
                            aria-label="Aumentar cantidad"
                        >
                            <Plus className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                        </button>
                    </div>
                ) : (
                    <div className={cn(
                        "flex items-center gap-1 bg-background rounded-lg border border-border shadow-sm",
                        isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                    )}>
                        <input
                            type="number"
                            className={cn(
                                "text-center font-semibold border-none focus:ring-0 p-0 bg-transparent text-foreground",
                                isCompact ? "w-12 text-xs" : "w-16 text-sm"
                            )}
                            value={localQuantity}
                            step="0.001"
                            onChange={(e) => handleLocalChange(e.target.value)}
                            onBlur={() => {
                                if (localQuantity === '' || isNaN(parseFloat(localQuantity))) {
                                    setLocalQuantity(item.quantity.toString());
                                }
                            }}
                        />
                        <span className="text-muted-foreground font-bold uppercase text-[10px]">kg</span>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'rounded-xl transition-colors',
                            isCompact ? 'h-8 w-8' : 'h-9 w-9',
                            hasDiscount
                                ? 'text-success bg-success-subtle hover:bg-success-subtle/80'
                                : 'text-muted-foreground hover:text-success hover:bg-success-subtle'
                        )}
                        onClick={() => setIsDiscountModalOpen(true)}
                        title="Aplicar descuento"
                    >
                        <Tag className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'rounded-xl text-muted-foreground hover:text-danger hover:bg-danger-subtle transition-colors',
                            isCompact ? 'h-8 w-8' : 'h-9 w-9'
                        )}
                        onClick={() => removeItem(item.productId)}
                        title="Eliminar producto"
                    >
                        <Trash2 className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
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
