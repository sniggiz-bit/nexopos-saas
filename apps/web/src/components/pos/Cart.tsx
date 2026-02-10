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


export function Cart({ items, onUpdateQuantity, onRemove, onCheckout, isProcessing }: CartProps) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const netAmount = total / 1.19;
    const taxValue = total - netAmount;

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
                    <div className="flex justify-between text-sm text-muted-foreground italic">
                        <span>Neto aprox.</span>
                        <span>{formatPrice(netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground italic">
                        <span>IVA (19%)</span>
                        <span>{formatPrice(taxValue)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <div className="flex flex-col">
                            <span>Total</span>
                            <span className="text-[10px] font-normal text-muted-foreground uppercase">IVA Incluido</span>
                        </div>
                        <span className="text-primary text-2xl">{formatPrice(total)}</span>
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
