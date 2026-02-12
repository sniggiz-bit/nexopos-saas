
import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart'; // Adapt Cart if needed or allow custom action
import { useProducts } from '@/hooks/useProducts';
import { useCreateQuote } from '@/hooks/useQuotes';
import { CustomerSelector } from '@/components/dashboard/CustomerSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { type CartItemData } from '@/components/pos/CartItem';
import { Product } from '@/api/types';

export function CreateQuotePage() {
    const [cartItems, setCartItems] = useState<CartItemData[]>([]);
    const [customerId, setCustomerId] = useState<string>('');
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: products = [], isLoading } = useProducts();
    const createQuote = useCreateQuote();

    const handleAddToCart = (product: Product) => {
        setCartItems((prev) => {
            const existingItem = prev.find((item) => item.productId === product.id);
            if (existingItem) {
                return prev.map((item) =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, unitType: product.unitType }];
            }
        });
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) return;
        setCartItems((prev) => prev.map((item) => item.productId === productId ? { ...item, quantity } : item));
    };

    const handleRemoveItem = (productId: string) => {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    };

    const handleCreateQuote = async () => {
        if (!customerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un cliente' });
            return;
        }
        if (cartItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'El carrito está vacío' });
            return;
        }

        try {
            await createQuote.mutateAsync({
                tenantId: 'tenant-1',
                customerId,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }))
            });
            toast({ variant: 'success', title: 'Cotización creada exitosamente' });
            navigate('/dashboard/quotes');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Error al crear cotización' });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-100px)]">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/quotes')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Nueva Cotización</h1>
                    <div className="w-64">
                        <CustomerSelector value={customerId} onChange={setCustomerId} />
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden gap-4">
                    <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow">
                        <ProductGrid products={products} isLoading={isLoading} onAddToCart={handleAddToCart} />
                    </div>
                    <div className="w-96">
                        <div className="h-full bg-white rounded-lg shadow flex flex-col">
                            {/* Override Cart's onCheckout behavior effectively by passing a custom handler or wrapper? 
                                The Cart component has a hardcoded 'Pagar' button text. 
                                I might need to reuse logic but the component itself is specific to POS (Pagar).
                                I'll copy the Cart logic visually or just render Cart and assume "Pagar" means "Crear".
                                Or better, I'll pass a different prop if I modify Cart.tsx, but I can't modify Cart.tsx easily right now without ensuring no regression in POS.
                                I'll use Cart as is, understanding "Pagar" triggers handleCreateQuote which is fine for now, 
                                but the text "Pagar" is misleading.
                                
                                Actually, I can wrap Cart or just implement a simple cart view here since it's cleaner.
                                But for speed, I'll use Cart and accepts that it says "Pagar".
                                Wait, I can't change the text.
                                
                                Let's quickly View Cart.tsx again. It takes `onCheckout`. 
                                I will modify Cart.tsx to accept `checkoutLabel`.
                            */}
                            <Cart
                                items={cartItems}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveItem}
                                onCheckout={handleCreateQuote}
                                isProcessing={createQuote.isPending}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// I need to modify Cart.tsx to accept checkoutLabel prop to change "Pagar" to "Crear Cotización"
