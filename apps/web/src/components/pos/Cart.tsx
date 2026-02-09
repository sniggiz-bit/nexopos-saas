import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem, type CartItemData } from './CartItem';
import { formatPrice } from '@/utils/formatters';
import { ShoppingCart } from 'lucide-react';

interface CartProps {
    items: CartItemData[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
    onCheckout: () => void;
    isProcessing?: boolean;
}

const TAX_RATE = 0.19; // 19% IVA in Chile

export function Cart({ items, onUpdateQuantity, onRemove, onCheckout, isProcessing }: CartProps) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const isEmpty = items.length === 0;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Carrito ({items.length})
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                        <ShoppingCart className="w-12 h-12 mb-2" />
                        <p className="text-sm">El carrito está vacío</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full px-6">
                        {items.map((item) => (
                            <CartItem
                                key={item.productId}
                                item={item}
                                onUpdateQuantity={onUpdateQuantity}
                                onRemove={onRemove}
                            />
                        ))}
                    </ScrollArea>
                )}
            </CardContent>

            <CardFooter className="flex-col gap-4 pt-4">
                <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA (19%)</span>
                        <span>{formatPrice(tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={onCheckout}
                    disabled={isEmpty || isProcessing}
                >
                    {isProcessing ? 'Procesando...' : 'Pagar'}
                </Button>
            </CardFooter>
        </Card>
    );
}
