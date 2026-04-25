import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Product } from '@/api/products';
import { resolveUnitPrice, PriceTier } from '@nexopos/shared';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface CartItemData {
    productId: string;
    name: string;
    basePrice: number;
    price: number | ''; // This is the resolved price
    quantity: number | '';
    unitType: 'UNIT' | 'WEIGHT';
    discountType?: DiscountType;
    discountValue?: number | '';
    priceTiers?: PriceTier[];
}

interface CartContextType {
    items: CartItemData[];
    addItem: (product: Product, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number | '') => void;
    removeItem: (productId: string) => void;
    applyDiscount: (productId: string, type: DiscountType | undefined, value?: number | '') => void;
    updatePrice: (productId: string, price: number | '') => void;
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
                return prev.map((item) => {
                    if (item.productId === product.id) {
                        const newQty = (Number(item.quantity) || 0) + (Number(quantity) || 0);
                        const newPrice = resolveUnitPrice(item.basePrice, item.priceTiers, newQty);
                        return { ...item, quantity: newQty, price: newPrice };
                    }
                    return item;
                });
            } else {
                const numericQty = Number(quantity) || 0;
                const initialPrice = resolveUnitPrice(product.price, product.priceTiers, numericQty);
                return [
                    ...prev,
                    {
                        productId: product.id,
                        name: product.name,
                        basePrice: product.price,
                        price: initialPrice,
                        quantity: quantity,
                        unitType: product.unitType as 'UNIT' | 'WEIGHT',
                        priceTiers: product.priceTiers,
                    },
                ];
            }
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number | '') => {
        if (typeof quantity === 'number' && quantity < 0) return; // Prevent negative quantity
        if (quantity === 0) {
            removeItem(productId);
            return;
        }
        setItems((prev) =>
            prev.map((item) => {
                if (item.productId === productId) {
                    const numericQty = Number(quantity) || 0;
                    const newPrice = resolveUnitPrice(item.basePrice, item.priceTiers, numericQty);
                    return { ...item, quantity, price: newPrice };
                }
                return item;
            })
        );
    }, []);

    const updatePrice = useCallback((productId: string, price: number | '') => {
        if (typeof price === 'number' && price < 0) return;
        setItems((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, price } : item
            )
        );
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
    }, []);

    const applyDiscount = useCallback((productId: string, type: DiscountType | undefined, value?: number | '') => {
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
        // 1. Items subtotal (price * quantity) before manual discounts
        const itemsSubtotal = items.reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
        }, 0);

        // 2. Total manual discounts
        const totalDiscount = items.reduce((sum, item) => {
            let discount = 0;
            const itemBaseTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const dVal = Number(item.discountValue) || 0;

            if (dVal && item.discountType) {
                if (item.discountType === 'PERCENTAGE') {
                    discount = (itemBaseTotal * dVal) / 100;
                } else {
                    discount = dVal;
                }
            }
            return sum + discount;
        }, 0);

        const total = Math.max(0, itemsSubtotal - totalDiscount);
        
        // In Chile, prices are IVA inclusivo (19%)
        const tax = total - (total / 1.19);
        const netAmount = total - tax;

        return {
            subtotal: itemsSubtotal,
            totalDiscount,
            total,
            tax,
            netAmount,
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
                updatePrice,
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
