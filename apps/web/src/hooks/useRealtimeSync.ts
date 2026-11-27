import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const PRODUCT_QUERIES = [['products'], ['products-all']];
const QUERY_KEYS_BY_EVENT: Record<string, string[][]> = {
  'sale.created': [...PRODUCT_QUERIES, ['sales'], ['dashboard'], ['shifts']],
  'purchase.created': [...PRODUCT_QUERIES, ['purchases'], ['dashboard']],
  'transfer.created': [...PRODUCT_QUERIES, ['transfers'], ['dashboard']],
  'inventory.adjusted': [...PRODUCT_QUERIES, ['dashboard']],
  'stock.updated': [...PRODUCT_QUERIES, ['dashboard']],
};

/**
 * Subscribes to the backend SSE stream and invalidates the relevant TanStack
 * Query caches whenever an inventory-changing event arrives. This gives every
 * open browser tab/window an instant stock update without manual refresh or
 * aggressive polling.
 *
 * The EventSource API auto-reconnects on connection loss, so the hook is
 * resilient to brief network interruptions and server restarts.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user?.tenantId || !token) return;

    const url =
      `${API_BASE}/events/stream` +
      `?tenantId=${encodeURIComponent(user.tenantId)}` +
      `&token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as { type?: string };
        const keys = QUERY_KEYS_BY_EVENT[data.type ?? ''];
        if (keys) {
          keys.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: key }),
          );
        }
      } catch {
        // malformed event — ignore
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically; just clean up the stale ref
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [user?.tenantId, token, queryClient]);
}
