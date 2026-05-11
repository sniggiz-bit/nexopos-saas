import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';

export function useSocket() {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!user?.tenantId || !token) return;

        const socketInstance = io(API_BASE || undefined, {
            path: '/socket.io',
            auth: {
                token,
                tenantId: user.tenantId,
            },
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.tenantId, token]);

    return socket;
}
