import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')).replace(/\/$/, '');

/**
 * useSocket — connects to the NexoPOS WebSocket gateway (/events namespace)
 * and returns the Socket.IO socket instance.
 *
 * The socket is:
 *  - Created once on mount (or when VITE_API_URL changes)
 *  - Automatically disconnected on unmount
 *  - Exposed as a stable ref so consumers can call socket.on / socket.off
 *    without triggering re-renders
 *
 * Usage:
 *   const socket = useSocket();
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on('inventory_updated', handler);
 *     return () => socket.off('inventory_updated', handler);
 *   }, [socket]);
 */
export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(`${SOCKET_URL}/events`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('[useSocket] Connected to WebSocket gateway:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[useSocket] Connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[useSocket] Disconnected:', reason);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socket;
}
