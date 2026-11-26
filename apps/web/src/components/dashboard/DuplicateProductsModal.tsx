import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    deactivateDuplicateProducts,
    getDuplicateProducts,
    type DuplicateProductCandidate,
} from '../../api/products';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface DuplicateProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (Array.isArray(message)) return message.join(', ');
        if (typeof message === 'string') return message;
        return error.message;
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatStock(product: DuplicateProductCandidate): string {
    if (product.inventory.length === 0) return 'Sin stock registrado';
    return product.inventory
        .map(level => `${level.branchName}: ${level.quantity}`)
        .join(' · ');
}

export function DuplicateProductsModal({ isOpen, onClose }: DuplicateProductsModalProps) {
    const queryClient = useQueryClient();
    const [keepers, setKeepers] = useState<Record<string, string>>({});
    const duplicatesQuery = useQuery({
        queryKey: ['product-duplicates'],
        queryFn: getDuplicateProducts,
        enabled: isOpen,
        staleTime: 0,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!isOpen || !duplicatesQuery.data) return;
        setKeepers(Object.fromEntries(
            duplicatesQuery.data.map(group => [group.groupId, group.products[0].id]),
        ));
    }, [isOpen, duplicatesQuery.data]);

    const productsToDeactivate = useMemo(() => {
        return (duplicatesQuery.data ?? [])
            .flatMap(group => {
                const keepId = keepers[group.groupId] ?? group.products[0]?.id;
                return group.products.filter(product => product.id !== keepId);
            });
    }, [duplicatesQuery.data, keepers]);

    const blockedProducts = productsToDeactivate.filter(product =>
        product.inventory.some(level => level.quantity !== 0),
    );
    const deactivateMutation = useMutation({
        mutationFn: deactivateDuplicateProducts,
        onSuccess: async result => {
            toast.success(`${result.deactivated} producto(s) duplicado(s) desactivado(s).`);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['products-all'] }),
                queryClient.invalidateQueries({ queryKey: ['products'] }),
                queryClient.invalidateQueries({ queryKey: ['product-duplicates'] }),
            ]);
        },
        onError: error => toast.error(getErrorMessage(error)),
    });

    const handleDeactivate = () => {
        const ids = productsToDeactivate.map(product => product.id);
        if (ids.length === 0 || blockedProducts.length > 0) return;
        const confirmed = window.confirm(
            `Se desactivarán ${ids.length} productos. No se borrarán permanentemente y se conservará su historial. ¿Continuar?`,
        );
        if (confirmed) deactivateMutation.mutate(ids);
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
            <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Revisión de productos duplicados</DialogTitle>
                    <DialogDescription>
                        Se agrupan por SKU; si no tienen SKU, se usa el código de barras.
                        Elige cuál conservar en cada grupo. Los demás se desactivarán sin borrar su historial.
                    </DialogDescription>
                </DialogHeader>

                {duplicatesQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Buscando duplicados...
                    </div>
                ) : duplicatesQuery.isError ? (
                    <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm">
                        <p className="text-red-500">{getErrorMessage(duplicatesQuery.error)}</p>
                        <button
                            type="button"
                            onClick={() => void duplicatesQuery.refetch()}
                            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-foreground hover:bg-muted"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reintentar
                        </button>
                    </div>
                ) : (duplicatesQuery.data?.length ?? 0) === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <ShieldCheck className="h-10 w-10 text-emerald-500" />
                        <p className="font-semibold">No se encontraron productos duplicados.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {duplicatesQuery.data?.length} grupo(s); {productsToDeactivate.length} registro(s) propuesto(s) para desactivar.
                            La selección inicial conserva el registro más antiguo; puedes cambiarla antes de continuar.
                        </p>

                        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                            {duplicatesQuery.data?.map(group => (
                                <section key={group.groupId} className="rounded-xl border border-border p-3">
                                    <h3 className="mb-2 text-sm font-bold">
                                        {group.identifierType}: <span className="font-mono">{group.identifierValue}</span>
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                            {group.products.length} registros
                                        </span>
                                    </h3>
                                    <div className="space-y-2">
                                        {group.products.map(product => {
                                            const isKept = (keepers[group.groupId] ?? group.products[0]?.id) === product.id;
                                            return (
                                                <label
                                                    key={product.id}
                                                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                                                        isKept
                                                            ? 'border-emerald-500/50 bg-emerald-500/5'
                                                            : 'border-border hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`keep-${group.groupId}`}
                                                        value={product.id}
                                                        checked={isKept}
                                                        disabled={deactivateMutation.isPending}
                                                        onChange={() => setKeepers(current => ({
                                                            ...current,
                                                            [group.groupId]: product.id,
                                                        }))}
                                                        className="mt-1 accent-emerald-500"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="font-semibold">{product.name}</span>
                                                            <span className={`text-xs font-semibold ${isKept ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                                {isKept ? 'Se conservará' : 'Se desactivará'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {product.sku ? `SKU: ${product.sku}` : 'Sin SKU'}
                                                            {product.barcode ? ` · Código: ${product.barcode}` : ' · Sin código de barras'}
                                                            {' · Creado: '}{new Date(product.createdAt).toLocaleDateString('es-CL')}
                                                            {' · Actualizado: '}{new Date(product.updatedAt).toLocaleDateString('es-CL')}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Precio: ${product.price.toLocaleString('es-CL')}
                                                            {' · Costo: $'}{product.costPrice.toLocaleString('es-CL')}
                                                            {' · Categoría: '}{product.categoryName || 'Sin categoría'}
                                                            {' · Marca: '}{product.brandName || 'Sin marca'}
                                                        </p>
                                                        <p className={`mt-1 text-xs ${!isKept && product.inventory.some(level => level.quantity !== 0) ? 'font-semibold text-amber-500' : 'text-muted-foreground'}`}>
                                                            Stock total: {product.stock} ({formatStock(product)})
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {blockedProducts.length > 0 && (
                            <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>
                                    No se pueden desactivar los registros seleccionados que tienen stock distinto de 0.
                                    Traspasa o ajusta ese stock, o elige conservar esos productos.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                        Cerrar
                    </button>
                    {(duplicatesQuery.data?.length ?? 0) > 0 && (
                        <button
                            type="button"
                            onClick={handleDeactivate}
                            disabled={
                                deactivateMutation.isPending
                                || productsToDeactivate.length === 0
                                || blockedProducts.length > 0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deactivateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Desactivar {productsToDeactivate.length} sobrante(s)
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
