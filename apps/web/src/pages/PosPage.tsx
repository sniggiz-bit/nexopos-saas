import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '@/api/products';
import { useProducts } from '@/hooks/useProducts';
import { useSale } from '@/hooks/useSale';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { type CartItemData } from '@/components/pos/CartItem';
import { CreateSaleRequest, PaymentMethod } from '@/api/sales';
import { useToast } from '@/hooks/use-toast';


export function PosPage() {
    const [cartItems, setCartItems] = useState<CartItemData[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [saleResult, setSaleResult] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: products = [], isLoading } = useProducts();

    const { mutate: createSale, isPending, isSuccess, isError, reset } = useSale({
        onSuccess: (data) => {
            setSaleResult(data);
            // Show success toast with DTE folio if available
            toast({
                variant: 'success',
                title: '¡Venta Exitosa!',
                description: data.dteFolio
                    ? `Folio: #${data.dteFolio}`
                    : `Venta ID: ${data.id}`,
            });

            // Clear cart and invalidate products query to update stock
            setCartItems([]);
            queryClient.invalidateQueries({ queryKey: ['products'] });

            // Close modal after delay - increased to 5s if there is a ticket
            setTimeout(() => {
                setIsPaymentModalOpen(false);
                reset();
                setSaleResult(null);
            }, data.dteFolio ? 5000 : 2000);
        },
        onError: (error) => {
            // Show error toast
            toast({
                variant: 'destructive',
                title: 'Error en la Venta',
                description: error.message || 'Ocurrió un error al procesar la venta',
            });
        },
    });

    const handleAddToCart = (product: Product) => {
        setCartItems((prev) => {
            const existingItem = prev.find((item) => item.productId === product.id);

            if (existingItem) {
                // Increment quantity if item already in cart
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Add new item to cart
                return [
                    ...prev,
                    {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        unitType: product.unitType,
                    },
                ];
            }
        });
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) return;

        setCartItems((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
    };

    const handleRemoveItem = (productId: string) => {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    };

    const handleCheckout = () => {
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = () => {
        // Construct payload matching backend requirements
        const saleData: CreateSaleRequest = {
            tenantId: 'tenant-1', // TODO: Get from auth context
            branchId: 'branch-1', // Hardcoded for now as per instructions
            items: cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
            paymentMethod: PaymentMethod.CASH,
        };

        createSale(saleData);
    };

    const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const tax = total - (total / 1.19);
    const subtotal = total - tax;

    return (
        <div className="h-screen flex">
            {/* Left side - Product Grid */}
            <div className="flex-1 overflow-y-auto bg-background">
                <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">Punto de Venta</h1>
                    <ProductGrid
                        products={products}
                        isLoading={isLoading}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </div>

            {/* Right side - Cart */}
            <div className="w-96 border-l bg-muted/30 p-4">
                <Cart
                    items={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    onCheckout={handleCheckout}
                    isProcessing={isPending}
                />
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    reset();
                }}
                onConfirm={handleConfirmPayment}
                items={cartItems}
                subtotal={subtotal}
                tax={tax}
                total={total}
                isProcessing={isPending}
                isSuccess={isSuccess}
                isError={isError}
                saleResult={saleResult}
            />
        </div>
    );
}

