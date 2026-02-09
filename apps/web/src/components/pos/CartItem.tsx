import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/formatters';
import { Minus, Plus, Trash2 } from 'lucide-react';

export interface CartItemData {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartItemProps {
    item: CartItemData;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const subtotal = item.price * item.quantity;

    return (
        <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground">
                    {formatPrice(item.price)} × {item.quantity}
                </p>
            </div>

            <div className="flex items-center gap-2">
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
