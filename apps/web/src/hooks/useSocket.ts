import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let globalSocket: Socket | null = null;

export function useSocket() {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(globalSocket);

    useEffect(() => {
        const url = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        
        if (!globalSocket) {
            globalSocket = io(url, {
                auth: {
                    token: token || '',
                    tenantId: user?.tenantId || '',
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });
            
            setSocket(globalSocket);

            globalSocket.on('connect', () => {
                console.log('WebSocket connected');
            });

            globalSocket.on('disconnect', () => {
                console.log('WebSocket disconnected');
            });
        }

        return () => {
            // No destruimos la conexión global al desmontar un componente
        };
    }, [user?.tenantId, token]);

    return socket;
}
