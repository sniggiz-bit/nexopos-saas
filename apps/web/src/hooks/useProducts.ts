import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getProducts, type Product } from '../api/products';
import { useSocket } from './useSocket';

/**
 * Hook to fetch products using TanStack Query
 */
export function useProducts(tenantId?: string) {
    const queryClient = useQueryClient();
    const socket = useSocket();

    const query = useQuery<Product[], Error>({
        queryKey: ['products', tenantId],
        queryFn: () => getProducts(tenantId),
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 120, // SSE/WebSockets handles real-time; this is a safety fallback
    });

    useEffect(() => {
        if (!socket) return;

        const handleInventoryUpdated = (payload: { productId: string; newStock: number }[]) => {
            queryClient.setQueryData<Product[]>(['products', tenantId], (oldProducts) => {
                if (!oldProducts) return oldProducts;

                const updatesMap = new Map(payload.map(p => [p.productId, p.newStock]));

                return oldProducts.map(product => {
                    if (updatesMap.has(product.id)) {
                        return { ...product, stock: updatesMap.get(product.id)! };
                    }
                    return product;
                });
            });
        };

        socket.on('inventory_updated', handleInventoryUpdated);

        return () => {
            socket.off('inventory_updated', handleInventoryUpdated);
        };
    }, [socket, queryClient, tenantId]);

    return query;
}
