import { useState, useMemo } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { usePurchases, useCreatePurchase } from '../../hooks/usePurchases';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useBranches } from '../../hooks/useBranches';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../api/types';
import type { Purchase } from '../../api/purchases';
import {
    Plus,
    Loader2,
    ShoppingCart,
    X,
    Search,
    Trash2,
    ChevronRight,
    Building2,
    Truck,
    CalendarDays,
    PackagePlus,
} from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PurchaseLineItem {
    product: Product;
    quantity: number | '';
    costPrice: number | '';
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: 'Completada', className: 'bg-muted/30 text-[#00D4FF] border border-border' },
    PENDING: { label: 'Pendiente', className: 'bg-[rgba(245,158,11,0.06)] text-[#F59E0B] border border-[rgba(245,158,11,0.15)]' },
    CANCELLED: { label: 'Cancelada', className: 'bg-[rgba(239,68,68,0.06)] text-[#EF4444] border border-[rgba(239,68,68,0.15)]' },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-[rgba(156,163,175,0.06)] text-gray-400 border border-[rgba(156,163,175,0.15)]' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PurchasesPage() {
    const { user } = useAuth();
    const { data: purchases, isLoading: loadingPurchases } = usePurchases();
    const createPurchase = useCreatePurchase();
    const { data: suppliers } = useSuppliers();
    const { branches } = useBranches();
    const { data: allProducts } = useProducts(user?.tenantId);

    const [showForm, setShowForm] = useState(false);

    // ── Form state ──
    const [branchId, setBranchId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([]);

    // ── Product search filter ──
    const filteredProducts = useMemo(() => {
        if (!productSearch || !allProducts) return [];
        const q = productSearch.toLowerCase();
        const alreadyAdded = new Set(lineItems.map((l) => l.product.id));
        return allProducts
            .filter(
                (p) =>
                    p.isActive &&
                    !alreadyAdded.has(p.id) &&
                    (p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
            )
            .slice(0, 8);
    }, [productSearch, allProducts, lineItems]);

    // ── Totals ──
    const totalAmount = useMemo(
        () => lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0), 0),
        [lineItems]
    );

    // ── Handlers ──
    const addProduct = (product: Product) => {
        setLineItems((prev) => [
            ...prev,
            { product, quantity: 1, costPrice: product.costPrice || 0 },
        ]);
        setProductSearch('');
    };

    const updateLineItem = (
        productId: string,
        field: 'quantity' | 'costPrice',
        value: number | ''
    ) => {
        setLineItems((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, [field]: value } : item
            )
        );
    };

    const removeLineItem = (productId: string) => {
        setLineItems((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const resetForm = () => {
        setBranchId('');
        setSupplierId('');
        setNotes('');
        setProductSearch('');
        setLineItems([]);
    };

    const handleCancel = () => {
        setShowForm(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId || lineItems.length === 0) return;

        await createPurchase.mutateAsync({
            branchId,
            ...(supplierId ? { supplierId } : {}),
            ...(notes ? { notes } : {}),
            items: lineItems.map((item) => ({
                productId: item.product.id,
                quantity: Number(item.quantity) || 0,
                costPrice: Number(item.costPrice) || 0,
            })),
        });

        setShowForm(false);
        resetForm();
    };

    const canSubmit = branchId && lineItems.length > 0 && lineItems.every((i) => (Number(i.quantity) || 0) > 0 && (Number(i.costPrice) || 0) >= 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* ── Header ── */}
                {!showForm && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <p className="text-gray-400 text-sm">
                            Registra compras a proveedores. El stock se actualiza automáticamente al guardar.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all rounded-lg flex items-center gap-2 font-semibold whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Registrar Compra
                        </button>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* FORM PANEL                                                  */}
                {/* ─────────────────────────────────────────────────────────── */}
                {showForm && (
                    <div className="bg-card/[0.5] rounded-2xl shadow-sm border border-border backdrop-blur-md overflow-hidden">
                        {/* Form Header */}
                        <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-center">
                                    <PackagePlus className="w-5 h-5 text-[#00D4FF]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Nueva Compra</h3>
                                    <p className="text-xs text-gray-400 font-medium">El stock se actualizará automáticamente al guardar</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-foreground hover:bg-card rounded-full p-1.5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* ── Selectors row ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Branch */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-gray-500" />
                                        Sucursal de Destino <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-card/[0.8] border border-border text-foreground rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none text-sm"
                                    >
                                        <option value="" className="bg-[hsl(220,30%,8%)] text-gray-400">— Seleccionar sucursal —</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id} className="bg-[hsl(220,30%,8%)] text-white">
                                                {b.name} {b.isMain ? '(Principal)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Supplier (optional) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-gray-500" />
                                        Proveedor <span className="text-gray-500 font-normal text-xs">(opcional)</span>
                                    </label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-card/[0.8] border border-border text-foreground rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none text-sm"
                                    >
                                        <option value="" className="bg-[hsl(220,30%,8%)] text-gray-400">— Sin proveedor —</option>
                                        {(suppliers ?? []).map((s) => (
                                            <option key={s.id} value={s.id} className="bg-[hsl(220,30%,8%)] text-white">
                                                {s.name} {s.rut ? `(${s.rut})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ── Product Search ── */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                                    <Search className="w-4 h-4 text-gray-500" />
                                    Agregar Producto
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Buscar por nombre o SKU..."
                                        className="w-full px-4 py-2.5 pl-10 bg-card/[0.8] border border-border text-foreground placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none text-sm"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />

                                    {/* Product dropdown */}
                                    {filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(220,30%,8%)] border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                                            {filteredProducts.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => addProduct(product)}
                                                    className="w-full px-4 py-3 text-left hover:bg-muted/30 border-b border-border last:border-b-0 transition-colors flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                                                        {product.sku && (
                                                            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        <p className="text-xs text-gray-400">Costo actual</p>
                                                        <p className="text-sm font-semibold text-[#00D4FF]">
                                                            {formatPrice(product.costPrice)}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {productSearch && filteredProducts.length === 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(220,30%,8%)] border border-border rounded-xl shadow-xl z-20 p-4 text-center text-sm text-gray-400">
                                            No se encontraron productos activos.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Line Items Table ── */}
                            {lineItems.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                                        Items de la Compra ({lineItems.length})
                                    </label>
                                    <div className="border border-border rounded-xl overflow-hidden bg-card/[0.3]">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-muted/30 border-b border-border">
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                                                        Producto
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase w-28">
                                                        Cantidad
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase w-36">
                                                        Costo Unitario
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase w-28">
                                                        Subtotal
                                                    </th>
                                                    <th className="px-4 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {lineItems.map((item) => (
                                                    <tr key={item.product.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-medium text-foreground">
                                                                {item.product.name}
                                                            </p>
                                                            {item.product.sku && (
                                                                <p className="text-xs text-gray-400">
                                                                    SKU: {item.product.sku}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                step="1"
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    updateLineItem(
                                                                        item.product.id,
                                                                        'quantity',
                                                                        e.target.value === '' ? '' : parseFloat(e.target.value)
                                                                    )
                                                                }
                                                                className="w-full text-center px-2 py-1.5 bg-card/[0.6] border border-border text-foreground rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none text-sm font-mono"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1"
                                                                    value={item.costPrice}
                                                                    onChange={(e) =>
                                                                        updateLineItem(
                                                                            item.product.id,
                                                                            'costPrice',
                                                                            e.target.value === '' ? '' : parseFloat(e.target.value)
                                                                        )
                                                                    }
                                                                    className="w-full pl-6 pr-2 py-1.5 bg-card/[0.6] border border-border text-foreground rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none text-sm font-mono"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-foreground font-mono">
                                                            {formatPrice((Number(item.quantity) || 0) * (Number(item.costPrice) || 0))}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeLineItem(item.product.id)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-[rgba(239,68,68,0.08)] p-1.5 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── Empty items state ── */}
                            {lineItems.length === 0 && (
                                <div className="border-2 border-dashed border-border bg-muted/30 rounded-xl p-8 text-center">
                                    <ShoppingCart className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">
                                        Usa el buscador de arriba para agregar productos a la compra.
                                    </p>
                                </div>
                            )}

                            {/* ── Notes ── */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Notas <span className="text-gray-500 font-normal text-xs">(opcional)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ej: Factura N° 3245, entrega parcial..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-card/[0.8] border border-border text-foreground placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none text-sm resize-none"
                                />
                            </div>

                            {/* ── Summary + Actions ── */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                                {/* Total */}
                                <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-5 py-3 w-full sm:w-auto">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                            Total Compra
                                        </p>
                                        <p className="text-2xl font-black text-[#00D4FF] font-mono tracking-tight">
                                            {formatPrice(totalAmount)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                                    <div className="text-sm text-gray-300">
                                        <span className="font-semibold text-[#00D4FF] font-mono">{lineItems.length}</span>{' '}
                                        {lineItems.length === 1 ? 'producto' : 'productos'}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 sm:flex-none px-4 py-2.5 text-gray-400 hover:bg-card hover:text-foreground rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || createPurchase.isPending}
                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                                    >
                                        {createPurchase.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-4 h-4" />
                                                Guardar Compra
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* PURCHASES HISTORY TABLE                                     */}
                {/* ─────────────────────────────────────────────────────────── */}
                <div>
                    {!showForm && (
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Historial de Compras
                        </h3>
                    )}
                    <div className="bg-card/[0.5] border border-border backdrop-blur-md rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            Fecha
                                        </span>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Sucursal
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loadingPurchases ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF] mx-auto" />
                                            <p className="mt-2 text-gray-400 text-sm">Cargando historial...</p>
                                        </td>
                                    </tr>
                                ) : !purchases || purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-400 font-medium">No hay compras registradas aún.</p>
                                            {!showForm && (
                                                <button
                                                    onClick={() => setShowForm(true)}
                                                    className="mt-3 text-[#00D4FF] hover:underline text-sm font-medium"
                                                >
                                                    + Registrar primera compra
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map((purchase: Purchase) => (
                                        <tr key={purchase.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(purchase.date).toLocaleDateString('es-CL', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {purchase.supplier?.name ?? (
                                                    <span className="text-gray-500 italic">Sin proveedor</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                                    {purchase.branch?.name ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                <span className="bg-muted/30 text-[#00D4FF] border border-border px-2 py-0.5 rounded-full text-xs font-semibold font-mono">
                                                    {purchase._count?.items ?? '—'} items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-foreground font-mono">
                                                {formatPrice(purchase.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <StatusBadge status={purchase.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
