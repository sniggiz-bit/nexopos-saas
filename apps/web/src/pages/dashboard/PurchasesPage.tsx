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
    COMPLETED: { label: 'Completada', className: 'bg-green-50 text-green-700 border border-green-200' },
    PENDING: { label: 'Pendiente', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border border-red-200' },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
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
                        <p className="text-gray-500 text-sm">
                            Registra compras a proveedores. El stock se actualiza automáticamente al guardar.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm font-medium whitespace-nowrap"
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
                    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
                        {/* Form Header */}
                        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <PackagePlus className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Nueva Compra</h3>
                                    <p className="text-xs text-gray-500">El stock se actualizará automáticamente al guardar</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1.5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* ── Selectors row ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Branch */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        Sucursal de Destino <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white"
                                    >
                                        <option value="">— Seleccionar sucursal —</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} {b.isMain ? '(Principal)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Supplier (optional) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-gray-400" />
                                        Proveedor <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                                    </label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white"
                                    >
                                        <option value="">— Sin proveedor —</option>
                                        {(suppliers ?? []).map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.rut ? `(${s.rut})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ── Product Search ── */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Search className="w-4 h-4 text-gray-400" />
                                    Agregar Producto
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Buscar por nombre o SKU..."
                                        className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                                    {/* Product dropdown */}
                                    {filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                            {filteredProducts.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => addProduct(product)}
                                                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                        {product.sku && (
                                                            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        <p className="text-xs text-gray-500">Costo actual</p>
                                                        <p className="text-sm font-semibold text-indigo-600">
                                                            {formatPrice(product.costPrice)}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {productSearch && filteredProducts.length === 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 text-center text-sm text-gray-500">
                                            No se encontraron productos activos.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Line Items Table ── */}
                            {lineItems.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Items de la Compra ({lineItems.length})
                                    </label>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                        Producto
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-28">
                                                        Cantidad
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-36">
                                                        Costo Unitario
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-28">
                                                        Subtotal
                                                    </th>
                                                    <th className="px-4 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {lineItems.map((item) => (
                                                    <tr key={item.product.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-medium text-gray-900">
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
                                                                className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
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
                                                                    className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                            {formatPrice((Number(item.quantity) || 0) * (Number(item.costPrice) || 0))}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeLineItem(item.product.id)}
                                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
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
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                    <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">
                                        Usa el buscador de arriba para agregar productos a la compra.
                                    </p>
                                </div>
                            )}

                            {/* ── Notes ── */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Notas <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ej: Factura N° 3245, entrega parcial..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm resize-none"
                                />
                            </div>

                            {/* ── Summary + Actions ── */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                                {/* Total */}
                                <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-5 py-3 w-full sm:w-auto">
                                    <div>
                                        <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">
                                            Total Compra
                                        </p>
                                        <p className="text-2xl font-bold text-indigo-700">
                                            {formatPrice(totalAmount)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-indigo-300 ml-2" />
                                    <div className="text-sm text-indigo-600">
                                        <span className="font-semibold">{lineItems.length}</span>{' '}
                                        {lineItems.length === 1 ? 'producto' : 'productos'}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 sm:flex-none px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || createPurchase.isPending}
                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-100 text-sm"
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
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Historial de Compras
                        </h3>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            Fecha
                                        </span>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Sucursal
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loadingPurchases ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                                            <p className="mt-2 text-gray-500 text-sm">Cargando historial...</p>
                                        </td>
                                    </tr>
                                ) : !purchases || purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No hay compras registradas aún.</p>
                                            {!showForm && (
                                                <button
                                                    onClick={() => setShowForm(true)}
                                                    className="mt-3 text-indigo-600 hover:underline text-sm font-medium"
                                                >
                                                    + Registrar primera compra
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map((purchase: Purchase) => (
                                        <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {new Date(purchase.date).toLocaleDateString('es-CL', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {purchase.supplier?.name ?? (
                                                    <span className="text-gray-300 italic">Sin proveedor</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                    {purchase.branch?.name ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                    {purchase._count?.items ?? '—'} items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
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
