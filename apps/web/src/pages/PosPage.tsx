import { useState } from 'react';
import { Product } from '@/api/products';
import { useProducts } from '@/hooks/useProducts';
import { useSale } from '@/hooks/useSale';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { type CartItemData } from '@/components/pos/CartItem';
import { CreateSaleRequest } from '@/api/sales';

const TAX_RATE = 0.19; // 19% IVA in Chile

export function PosPage() {
    const [cartItems, setCartItems] = useState<CartItemData[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const { data: products = [], isLoading } = useProducts();

    const { mutate: createSale, isPending, isSuccess, isError, reset } = useSale({
        onSuccess: () => {
            // Clear cart after successful sale
            setTimeout(() => {
                setCartItems([]);
                setIsPaymentModalOpen(false);
                reset();
            }, 2000);
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
                    },
                ];
            }
        });
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;

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
        const subtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;

        const saleData: CreateSaleRequest = {
            items: cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity,
            })),
            subtotal,
            tax,
            total,
        };

        createSale(saleData);
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

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
            />
        </div>
    );
}
