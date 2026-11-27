import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { getSalesMode } from '@/api/dte-config';
import { getProductsPaginated, type Product } from '@/api/products';
import { createSale, type CreateSaleRequest } from '@/api/sales';
import type { Shift } from '@/api/shifts';
import {
    invalidatePosSnapshot, offlineProducts, queueOfflineSale, readPosStorage, reserveOnlineSale,
    retryQueuedSale, savePosSnapshot, snapshotUsable, updateQueuedSale, type OfflineRequest, type PosStorage,
} from '@/offline/pos-storage';

const WARM_INTERVAL = 5 * 60_000;
const PAGE_LIMIT = 200;
const EMPTY_STORAGE: PosStorage = { sales: [] };

function temporaryFailure(error: unknown) {
    return isAxiosError(error) && (!error.response || error.response.status >= 500 || [408, 429].includes(error.response.status));
}

function saleIssue(error: unknown) {
    if (isAxiosError<{ message?: string | string[] }>(error)) {
        const message = error.response?.data?.message;
        if (Array.isArray(message)) return message.join(' ');
        if (typeof message === 'string') return message;
    }
    return 'El servidor no pudo registrar esta venta. Revisa los datos antes de reintentar.';
}

function catalogProduct(product: Product): Product {
    const { id, name, sku, barcode, price, minStock, stock, unitType, category, tenantId, priceTiers } = product;
    return { id, name, sku, barcode, price, minStock, stock, unitType, category, tenantId, priceTiers, isActive: true, costPrice: 0 };
}

async function fetchSnapshotProducts(signal: AbortSignal) {
    const options = { signal, timeout: 15000 };
    const first = await getProductsPaginated({ page: 1, limit: PAGE_LIMIT }, options);
    const products = new Map(first.data.map(product => [product.id, catalogProduct(product)]));
    for (let page = 2; page <= first.totalPages; page += 3) {
        const batch = Array.from({ length: Math.min(3, first.totalPages - page + 1) }, (_, i) =>
            getProductsPaginated({ page: page + i, limit: PAGE_LIMIT }, options));
        for (const result of await Promise.all(batch)) {
            for (const product of result.data) products.set(product.id, catalogProduct(product));
        }
    }
    if (products.size !== first.total) throw new Error('El catálogo cambió durante la descarga. Se volverá a intentar.');
    return Array.from(products.values());
}

interface PosConnection {
    scope: string;
    liveShift?: Shift | null;
    shiftCheckedAt: number;
    shiftError: unknown;
    token: string | null;
}

export function useOfflinePos({ scope, liveShift, shiftCheckedAt, shiftError, token }: PosConnection) {
    const queryClient = useQueryClient();
    const [online, setOnline] = useState(() => navigator.onLine);
    const [view, setView] = useState<{ scope: string; storage: PosStorage }>();
    const [storageError, setStorageError] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const channel = useRef<BroadcastChannel | undefined>(undefined);
    const state = view?.scope === scope ? view.storage : EMPTY_STORAGE;
    const offline = !online || temporaryFailure(shiftError);
    const denied = isAxiosError(shiftError) && [401, 403].includes(shiftError.response?.status ?? 0);
    const shiftId = liveShift?.id;
    const shiftRef = useRef(liveShift);
    shiftRef.current = liveShift;

    const refresh = useCallback(async () => {
        if (!scope) return;
        try {
            const storage = await readPosStorage(scope);
            setStorageError('');
            setView({ scope, storage });
        } catch {
            setStorageError('No se pudo acceder al almacenamiento de ventas sin conexión.');
        }
    }, [scope]);

    const refreshAndNotify = useCallback(async () => {
        channel.current?.postMessage(scope);
        await refresh();
    }, [scope, refresh]);

    useEffect(() => {
        const change = () => setOnline(navigator.onLine);
        window.addEventListener('online', change);
        window.addEventListener('offline', change);
        document.addEventListener('visibilitychange', change);
        const timer = window.setInterval(change, 5000);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', change);
            window.removeEventListener('online', change);
            window.removeEventListener('offline', change);
        };
    }, []);

    useEffect(() => {
        void refresh();
        if (typeof BroadcastChannel !== 'function') return;
        const bus = new BroadcastChannel('nexopos-offline-pos');
        channel.current = bus;
        bus.onmessage = event => { if (event.data === scope) void refresh(); };
        return () => { channel.current = undefined; bus.close(); };
    }, [scope, refresh]);

    useEffect(() => {
        if (!scope || !token || offline || denied || !shiftCheckedAt || shiftError || liveShift !== null) return;
        void invalidatePosSnapshot(scope, shiftCheckedAt).then(refreshAndNotify).catch(() => {});
    }, [scope, token, offline, denied, shiftCheckedAt, shiftError, liveShift, refreshAndNotify]);

    useEffect(() => {
        if (!scope || !token || denied) return;
        const controller = new AbortController();
        const { signal } = controller;
        let running = false;
        let lastSyncAt = 0;

        const sync = async () => {
            const { sales } = await readPosStorage(scope);
            const pending = sales.filter(sale => sale.status === 'pending').sort((a, b) => a.recordedAt - b.recordedAt);
            if (!pending.length || signal.aborted) return;
            setSyncing(true);
            let committed = false;
            try {
                for (const entry of pending) {
                    if (signal.aborted || !navigator.onLine || !entry.request) break;
                    try {
                        const sale = await createSale(entry.request, { signal, timeout: 20000 });
                        if (!sale?.id || sale.offlineId !== entry.id) break;
                    } catch (error) {
                        if (signal.aborted || temporaryFailure(error) ||
                            (isAxiosError(error) && error.response?.status === 401)) break;
                        await updateQueuedSale(scope, entry.id, 'review', saleIssue(error));
                        continue;
                    }
                    await updateQueuedSale(scope, entry.id, 'synced');
                    committed = true;
                }
            } finally {
                if (committed) {
                    lastSyncAt = Date.now();
                    for (const key of ['products', 'products-all', 'sales', 'dashboard', 'shift-live-summary']) {
                        void queryClient.invalidateQueries({ queryKey: [key] });
                    }
                }
                if (!signal.aborted) setSyncing(false);
                await refreshAndNotify();
            }
        };

        const warm = async () => {
            const shift = shiftRef.current;
            if (!shift || shift.status !== 'OPEN' || signal.aborted) return;
            const { snapshot, sales } = await readPosStorage(scope);
            if (sales.some(sale => sale.status === 'pending')) return;
            if (snapshot?.shift.id === shift.id && snapshotUsable(snapshot) &&
                snapshot.savedAt >= lastSyncAt && Date.now() - snapshot.savedAt < WARM_INTERVAL) return;
            const started = Date.now();
            setPreparing(true);
            try {
                const [mode, products] = await Promise.all([
                    getSalesMode({ signal, timeout: 10000 }),
                    fetchSnapshotProducts(signal),
                ]);
                if (signal.aborted || shiftRef.current?.id !== shift.id || !['internal', 'fiscal'].includes(mode.mode)) return;
                if (await savePosSnapshot({ scope, shift, salesMode: mode.mode, savedAt: Date.now(), products }, started)) {
                    await refreshAndNotify();
                    void navigator.storage?.persist?.().catch(() => {});
                }
            } finally {
                if (!signal.aborted) setPreparing(false);
            }
        };

        const run = async () => {
            if (running || signal.aborted || !navigator.onLine) return;
            running = true;
            try {
                if (navigator.locks) {
                    await navigator.locks.request('nexopos-pos-sync:' + scope, { ifAvailable: true }, async lock => {
                        if (!lock) return;
                        await sync();
                        await warm();
                    });
                } else {
                    await sync();
                    await warm();
                }
            } catch {
                // A future interval retries the download or reads storage again.
            } finally {
                running = false;
            }
        };

        const event = () => { void run(); };
        event();
        const timer = window.setInterval(event, 20000);
        window.addEventListener('focus', event);
        window.addEventListener('online', event);
        window.addEventListener('nexopos:sync-sales', event);
        return () => {
            controller.abort();
            window.clearInterval(timer);
            window.removeEventListener('focus', event);
            window.removeEventListener('online', event);
            window.removeEventListener('nexopos:sync-sales', event);
            setSyncing(false);
            setPreparing(false);
        };
    }, [scope, token, denied, queryClient, refreshAndNotify]);

    useEffect(() => {
        if (shiftId) window.dispatchEvent(new Event('nexopos:sync-sales'));
    }, [shiftId]);

    const record = useCallback(async (request: OfflineRequest) => {
        await queueOfflineSale(scope, request);
        await refreshAndNotify();
    }, [scope, refreshAndNotify]);

    const trackOnlineSale = useCallback((id: string, items: CreateSaleRequest['items']) => {
        if (scope) void reserveOnlineSale(scope, id, items).then(refreshAndNotify).catch(() => {});
    }, [scope, refreshAndNotify]);

    const retry = useCallback(async (id: string) => {
        await retryQueuedSale(scope, id);
        await refreshAndNotify();
        window.dispatchEvent(new Event('nexopos:sync-sales'));
    }, [scope, refreshAndNotify]);

    const pending = state.sales.filter(sale => sale.status !== 'synced').sort((a, b) => a.recordedAt - b.recordedAt);
    const products = useMemo(() => offlineProducts(state), [state]);
    const ready = !!scope && !storageError && !denied && snapshotUsable(state.snapshot);

    return {
        offline, ready, preparing, syncing, storageError, products, pending,
        snapshot: ready ? state.snapshot : undefined, record, trackOnlineSale, retry,
    };
}
