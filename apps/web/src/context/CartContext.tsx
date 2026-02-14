import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Product } from '@/api/products';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface CartItemData {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    unitType: 'UNIT' | 'WEIGHT';
    discountType?: DiscountType;
    discountValue?: number;
}

interface CartContextType {
    items: CartItemData[];
    addItem: (product: Product, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    applyDiscount: (productId: string, type: DiscountType | undefined, value?: number) => void;
    clearCart: () => void;
    totals: {
        total: number;
        tax: number;
        subtotal: number;
        totalDiscount: number;
    };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItemData[]>([]);

    const addItem = useCallback((product: Product, quantity: number = 1) => {
        setItems((prev) => {
            const existingItem = prev.find((item) => item.productId === product.id);

            if (existingItem) {
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [
                    ...prev,
                    {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: quantity,
                        unitType: product.unitType as 'UNIT' | 'WEIGHT',
                    },
                ];
            }
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
    }, []);

    const applyDiscount = useCallback((productId: string, type: DiscountType | undefined, value?: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, discountType: type, discountValue: value }
                    : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totals = useMemo(() => {
        const totalWithDiscounts = items.reduce((sum, item) => {
            let itemTotal = item.price * item.quantity;
            if (item.discountValue && item.discountType) {
                if (item.discountType === 'PERCENTAGE') {
                    itemTotal -= (itemTotal * item.discountValue) / 100;
                } else {
                    itemTotal -= item.discountValue;
                }
            }
            return sum + Math.max(0, itemTotal);
        }, 0);

        const tax = totalWithDiscounts - (totalWithDiscounts / 1.19);
        const subtotal = totalWithDiscounts - tax;

        const totalOriginal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalDiscount = totalOriginal - totalWithDiscounts;

        return {
            total: totalWithDiscounts,
            tax,
            subtotal,
            totalDiscount,
        };
    }, [items]);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                updateQuantity,
                removeItem,
                applyDiscount,
                clearCart,
                totals,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
