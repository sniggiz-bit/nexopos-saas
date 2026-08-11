import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Product } from '@/api/products';
import { resolveUnitPrice, PriceTier } from '@nexopos/shared';
import { useSocket } from '@/hooks/useSocket';

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
    stock?: number;
}

interface CartContextType {
    items: CartItemData[];
    quoteId: string | null;
    customerId: string | null;
    addItem: (product: Product, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number | '') => void;
    removeItem: (productId: string) => void;
    applyDiscount: (productId: string, type: DiscountType | undefined, value?: number | '') => void;
    updatePrice: (productId: string, price: number | '') => void;
    clearCart: () => void;
    loadQuoteItems: (quote: any) => void;
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
    const [quoteId, setQuoteId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleStockUpdated = (data: { productId: string; stock: number }) => {
            setItems((prev) => {
                const updated = prev.map((item) => {
                    if (item.productId === data.productId) {
                        const numericQty = Number(item.quantity) || 0;
                        if (numericQty > data.stock) {
                            const newQty = data.stock;
                            const newPrice = resolveUnitPrice(item.basePrice, item.priceTiers, newQty);
                            return { ...item, stock: data.stock, quantity: newQty, price: newPrice };
                        }
                        return { ...item, stock: data.stock };
                    }
                    return item;
                });
                return updated.filter((item) => (Number(item.quantity) || 0) > 0);
            });
        };

        const handlePriceUpdated = (data: { productId: string; price: number; priceTiers?: PriceTier[] }) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.productId === data.productId) {
                        const numericQty = Number(item.quantity) || 0;
                        const newTiers = data.priceTiers || item.priceTiers;
                        const newPrice = resolveUnitPrice(data.price, newTiers, numericQty);
                        return { ...item, basePrice: data.price, priceTiers: newTiers, price: newPrice };
                    }
                    return item;
                })
            );
        };

        socket.on('product.stock.updated', handleStockUpdated);
        socket.on('product.price.updated', handlePriceUpdated);

        return () => {
            socket.off('product.stock.updated', handleStockUpdated);
            socket.off('product.price.updated', handlePriceUpdated);
        };
    }, [socket]);

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
        setQuoteId(null);
        setCustomerId(null);
    }, []);

    const loadQuoteItems = useCallback((quote: any) => {
        setQuoteId(quote.id || null);
        setCustomerId(quote.customerId || null);
        const loaded: CartItemData[] = (quote.items || []).map((qItem: any) => ({
            productId: qItem.productId,
            name: qItem.productName || qItem.product?.name || 'Producto',
            basePrice: Number(qItem.price) || 0,
            price: Number(qItem.price) || 0,
            quantity: Number(qItem.quantity) || 1,
            unitType: 'UNIT' as const,
            discountType: 'FIXED' as const,
            discountValue: Number(qItem.discount) || 0,
        }));
        setItems(loaded);
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
                quoteId,
                customerId,
                addItem,
                updateQuantity,
                removeItem,
                applyDiscount,
                updatePrice,
                clearCart,
                loadQuoteItems,
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
