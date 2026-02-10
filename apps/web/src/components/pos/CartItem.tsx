import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/formatters';
import { Minus, Plus, Trash2 } from 'lucide-react';

export interface CartItemData {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    unitType: 'UNIT' | 'WEIGHT';
}

interface CartItemProps {
    item: CartItemData;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());
    const subtotal = item.price * item.quantity;

    // Sync local state if quantity changes from outside (e.g. Plus/Minus or Re-add)
    useEffect(() => {
        setLocalQuantity(item.quantity.toString());
    }, [item.quantity]);

    const handleLocalChange = (val: string) => {
        setLocalQuantity(val);
        const numericVal = parseFloat(val);
        if (!isNaN(numericVal) && numericVal > 0) {
            onUpdateQuantity(item.productId, numericVal);
        }
    };

    return (
        <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground">
                    {formatPrice(item.price)} × {item.quantity}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {item.unitType === 'UNIT' ? (
                    <>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            className="w-20 h-7 text-center text-sm border rounded focus:ring-1 focus:ring-primary outline-none"
                            value={localQuantity}
                            step="0.001"
                            onChange={(e) => handleLocalChange(e.target.value)}
                            onBlur={() => {
                                // Reset to actual quantity if left empty or invalid
                                if (localQuantity === '' || isNaN(parseFloat(localQuantity))) {
                                    setLocalQuantity(item.quantity.toString());
                                }
                            }}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                            kg
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm min-w-[80px] text-right">
                    {formatPrice(subtotal)}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onRemove(item.productId)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
