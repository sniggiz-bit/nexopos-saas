import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export const useSocket = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'https://api.nexopos.cl');

        socket.on('inventoryUpdated', (payload) => {
            // Esta es la magia: invalida el cache de TanStack Query para que el stock se refresque solo
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', payload.productId] });
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);
};