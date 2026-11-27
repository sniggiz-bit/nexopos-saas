import type { Product } from '@/api/products';
import type { CreateSaleRequest, OfflineSaleDetails } from '@/api/sales';
import type { Shift } from '@/api/shifts';

const DB_NAME = 'nexopos-offline-pos';
const CATALOG = 'catalog';
const SALES = 'sales';
const MAX_CATALOG_AGE = 24 * 60 * 60_000;

export type OfflineRequest = CreateSaleRequest & { offline: OfflineSaleDetails };

export interface PosSnapshot {
    scope: string;
    savedAt: number;
    shift: Shift;
    salesMode: 'internal' | 'fiscal';
    products: Product[];
}

interface StoredSale {
    id: string;
    scope: string;
    recordedAt: number;
    status: 'pending' | 'review' | 'synced';
    items: CreateSaleRequest['items'];
    request?: OfflineRequest;
    issue?: string;
    syncedAt?: number;
}

export interface PosStorage {
    snapshot?: PosSnapshot;
    sales: StoredSale[];
}

let connection: Promise<IDBDatabase> | undefined;

function openDatabase() {
    connection ??= new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore(CATALOG, { keyPath: 'scope' });
            const sales = db.createObjectStore(SALES, { keyPath: 'id' });
            sales.createIndex('scope', 'scope');
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => { db.close(); connection = undefined; };
            resolve(db);
        };
    }).catch(error => { connection = undefined; throw error; });
    return connection;
}

function resultOf<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function withStorage<T>(mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>) {
    const db = await openDatabase();
    const tx = db.transaction([CATALOG, SALES], mode);
    const finished = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar en este equipo.'));
    });
    try {
        const value = await work(tx);
        await finished;
        return value;
    } catch (error) {
        try { tx.abort(); } catch { /* already finished */ }
        await finished.catch(() => {});
        throw error;
    }
}

async function getStorage(tx: IDBTransaction, scope: string): Promise<PosStorage> {
    const [snapshot, sales] = await Promise.all([
        resultOf<PosSnapshot | undefined>(tx.objectStore(CATALOG).get(scope)),
        resultOf<StoredSale[]>(tx.objectStore(SALES).index('scope').getAll(scope)),
    ]);
    return { snapshot, sales };
}

export function readPosStorage(scope: string) {
    return withStorage('readonly', tx => getStorage(tx, scope));
}

export function snapshotUsable(snapshot: PosSnapshot | undefined) {
    return Boolean(snapshot && snapshot.shift.status === 'OPEN' &&
        Date.now() >= snapshot.savedAt - 5 * 60_000 && Date.now() - snapshot.savedAt < MAX_CATALOG_AGE);
}

export function savePosSnapshot(snapshot: PosSnapshot, started: number) {
    return withStorage('readwrite', async tx => {
        const previous = await getStorage(tx, snapshot.scope);
        if ((previous.snapshot?.savedAt ?? 0) >= started || previous.sales.some(sale =>
            sale.status === 'pending' || (sale.syncedAt ?? 0) >= started)) return false;
        tx.objectStore(CATALOG).put(snapshot);
        for (const sale of previous.sales) {
            if (sale.status === 'synced') tx.objectStore(SALES).delete(sale.id);
        }
        return true;
    });
}

export function invalidatePosSnapshot(scope: string, before: number) {
    return withStorage('readwrite', async tx => {
        const { snapshot } = await getStorage(tx, scope);
        if (snapshot && snapshot.savedAt <= before) tx.objectStore(CATALOG).delete(scope);
    });
}

function stockReservations(sales: StoredSale[]) {
    const removed = new Map<string, number>();
    for (const sale of sales) {
        for (const item of sale.items) {
            removed.set(item.productId, (removed.get(item.productId) ?? 0) + Math.round(item.quantity * 1000));
        }
    }
    return removed;
}

export function offlineProducts(storage: PosStorage) {
    const removed = stockReservations(storage.sales);
    return storage.snapshot?.products.map(product => ({
        ...product,
        stock: (Math.round(product.stock * 1000) - (removed.get(product.id) ?? 0)) / 1000,
    })) ?? [];
}

export function queueOfflineSale(scope: string, request: OfflineRequest) {
    return withStorage('readwrite', async tx => {
        const { snapshot, sales } = await getStorage(tx, scope);
        if (sales.some(sale => sale.id === request.offline.id)) return;
        if (!snapshot || !snapshotUsable(snapshot) || snapshot.shift.id !== request.offline.shiftId) {
            throw new Error('Este equipo necesita cargar el turno y el catálogo con conexión antes de vender.');
        }
        if (snapshot.salesMode === 'fiscal' && !request.offline.receiptReference) {
            throw new Error('Ingresa la referencia del documento tributario de contingencia.');
        }

        const products = new Map(snapshot.products.map(product => [product.id, product]));
        const removed = stockReservations(sales);
        const seen = new Set<string>();
        let total = 0;
        for (const item of request.items) {
            const product = products.get(item.productId);
            const quantity = Math.round(item.quantity * 1000);
            if (!product || !Number.isFinite(item.quantity) || quantity <= 0 ||
                Math.abs(item.quantity * 1000 - quantity) > 0.0001 ||
                (product.unitType === 'UNIT' && quantity % 1000 !== 0) || seen.has(item.productId)) {
                throw new Error('Revisa las cantidades y los productos del carrito.');
            }
            seen.add(item.productId);
            const available = Math.round(product.stock * 1000) - (removed.get(product.id) ?? 0);
            if (quantity > available) throw new Error('Stock local insuficiente para ' + product.name + '.');
            const price = item.price ?? product.price;
            const line = price * item.quantity - (item.discountAmount ?? 0);
            if (!Number.isFinite(line) || line < 0) throw new Error('Revisa los precios y descuentos del carrito.');
            total += line;
        }
        const payment = request.payments[0];
        if (!payment || request.payments.length !== 1 || !Number.isFinite(payment.amount) ||
            total <= 0 || Math.abs(payment.amount - total) > 0.01) {
            throw new Error('El monto registrado debe coincidir con el total de la venta.');
        }
        const sale: StoredSale = {
            id: request.offline.id, scope, recordedAt: Date.parse(request.offline.recordedAt),
            status: 'pending', items: request.items, request,
        };
        tx.objectStore(SALES).add(sale);
    });
}

export function reserveOnlineSale(scope: string, id: string, items: CreateSaleRequest['items']) {
    return withStorage('readwrite', async tx => {
        const snapshot = await resultOf<PosSnapshot | undefined>(tx.objectStore(CATALOG).get(scope));
        if (!snapshot) return;
        const now = Date.now();
        const key = 'online:' + id;
        const reservation: StoredSale = { id: key, scope, recordedAt: now, status: 'synced', items, syncedAt: now };
        tx.objectStore(SALES).put(reservation);
    });
}

export function updateQueuedSale(scope: string, id: string, status: 'review' | 'synced', issue?: string) {
    return withStorage('readwrite', async tx => {
        const store = tx.objectStore(SALES);
        const sale = await resultOf<StoredSale | undefined>(store.get(id));
        if (!sale || sale.scope !== scope || sale.status === 'synced') return;
        store.put(status === 'synced'
            ? { ...sale, status, request: undefined, issue: undefined, syncedAt: Date.now() }
            : { ...sale, status, issue });
    });
}

export function retryQueuedSale(scope: string, id: string) {
    return withStorage('readwrite', async tx => {
        const store = tx.objectStore(SALES);
        const sale = await resultOf<StoredSale | undefined>(store.get(id));
        if (sale?.scope === scope && sale.status === 'review') store.put({ ...sale, status: 'pending', issue: undefined });
    });
}
