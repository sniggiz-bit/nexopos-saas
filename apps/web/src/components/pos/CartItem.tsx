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

    const baseSubtotal = item.price * item.quantity;
    let finalSubtotal = baseSubtotal;
    let discountAmount = 0;

    if (item.discountValue && item.discountType) {
        if (item.discountType === 'PERCENTAGE') {
            discountAmount = (baseSubtotal * item.discountValue) / 100;
        } else {
            discountAmount = item.discountValue;
        }
        finalSubtotal = Math.max(0, baseSubtotal - discountAmount);
    }

    useEffect(() => {
        setLocalQuantity(item.quantity.toString());
    }, [item.quantity]);

    const handleLocalChange = (val: string) => {
        setLocalQuantity(val);
        const numericVal = parseFloat(val);
        if (!isNaN(numericVal) && numericVal > 0) {
            updateQuantity(item.productId, numericVal);
        }
    };

    return (
        <div className="group flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{item.name}</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                            {formatPrice(item.price)}
                        </span>
                        {discountAmount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-green-600 border-green-200 bg-green-50">
                                -{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : formatPrice(item.discountValue!)}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span className="font-bold text-slate-900 text-base">
                        {formatPrice(finalSubtotal)}
                    </span>
                    {discountAmount > 0 && (
                        <p className="text-[10px] text-slate-400 line-through">
                            {formatPrice(baseSubtotal)}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    {item.unitType === 'UNIT' ? (
                        <div className="flex items-center bg-white rounded-full border border-slate-200 shadow-sm p-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-slate-100 text-slate-600"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-8 text-center text-sm font-semibold text-slate-700">
                                {item.quantity}
                            </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-slate-100 text-slate-600"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-sm">
                            <input
                                type="number"
                                className="w-16 text-center text-sm font-semibold border-none focus:ring-0 p-0 text-slate-700"
                                value={localQuantity}
                                step="0.001"
                                onChange={(e) => handleLocalChange(e.target.value)}
                                onBlur={() => {
                                    if (localQuantity === '' || isNaN(parseFloat(localQuantity))) {
                                        setLocalQuantity(item.quantity.toString());
                                    }
                                }}
                            />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                                kg
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors",
                            discountAmount > 0 && "text-emerald-600 bg-emerald-50"
                        )}
                        onClick={() => setIsDiscountModalOpen(true)}
                        title="Aplicar Descuento"
                    >
                        <Tag className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100"
                        onClick={() => removeItem(item.productId)}
                        title="Eliminar"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <DiscountModal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                itemName={item.name}
                itemPrice={item.price * item.quantity}
                currentDiscountType={item.discountType}
                currentDiscountValue={item.discountValue}
                onApply={(type, value) => applyDiscount(item.productId, type, value)}
            />
        </div>
    );
}
