import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useProducts } from '../../hooks/useProducts';
import { useDeleteProduct } from '../../hooks/useDeleteProduct';
import { ProductFormModal } from '../../components/dashboard/ProductFormModal';
import { InventoryKardexModal } from '../../components/dashboard/InventoryKardexModal';
import { Plus, Search, Edit, Trash2, History, Package, AlertTriangle } from 'lucide-react';
import type { Product } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    cyan:   '#00D4FF',
    cyanA:  (a: number) => `rgba(0,212,255,${a})`,
    red:    '#F87171',
    redA:   (a: number) => `rgba(248,113,113,${a})`,
    amber:  '#F59E0B',
    amberA: (a: number) => `rgba(245,158,11,${a})`,
    violet: '#A78BFA',
    violetA:(a: number) => `rgba(167,139,250,${a})`,
    green:  '#34D399',
    greenA: (a: number) => `rgba(52,211,153,${a})`,
    text: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted-foreground))',
    subtle: 'hsl(var(--muted-foreground))',
};

const inputStyle: React.CSSProperties = {
    background: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    padding:      '7px 12px 7px 36px',
    fontSize:     '13px',
    color: 'hsl(var(--foreground))',
    outline:      'none',
    width:        '100%',
};

const COLS = ['Producto', 'Cód. Barras', 'Categoría', 'Precio', 'Stock', 'Tipo', 'Acciones'];

export function ProductsPage() {
    const [searchTerm,    setSearchTerm]    = useState('');
    const [isModalOpen,   setIsModalOpen]   = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isKardexOpen,  setIsKardexOpen]  = useState(false);
    const [productForKardex, setProductForKardex] = useState<Product | null>(null);
    const { user } = useAuth();

    const { data: products, isLoading } = useProducts(user?.tenantId);
    const deleteProduct = useDeleteProduct();

    const filtered = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleEdit   = (p: Product) => { setProductToEdit(p);    setIsModalOpen(true); };
    const handleKardex = (p: Product) => { setProductForKardex(p); setIsKardexOpen(true); };
    const handleDelete = async (p: Product) => {
        if (window.confirm(`¿Eliminar "${p.name}"?`)) await deleteProduct.mutateAsync(p.id);
    };

    return (
        <DashboardLayout>
            <div className="space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4">
                    {/* Buscador */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color: C.cyanA(0.4) }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={inputStyle}
                            onFocus={e  => (e.currentTarget.style.borderColor = C.cyanA(0.4))}
                            onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)')}
                        />
                    </div>

                    {/* Nuevo Producto */}
                    <button
                        onClick={() => { setProductToEdit(null); setIsModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-150 shrink-0"
                        style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.2) 0%,rgba(0,212,255,0.08) 100%)', border: `1px solid ${C.cyanA(0.3)}`, color: C.cyan }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,rgba(0,212,255,0.28) 0%,rgba(0,212,255,0.14) 100%)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,rgba(0,212,255,0.2) 0%,rgba(0,212,255,0.08) 100%)'}>
                        <Plus className="w-4 h-4" style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }} />
                        Nuevo Producto
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-[13px]">
                            <thead>
                                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                    {COLS.map(col => (
                                        <th key={col}
                                            className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${col === 'Acciones' ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse" style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
                                            {COLS.map(c => (
                                                <td key={c} className="px-5 py-4">
                                                    <div className="h-3.5 rounded-lg" style={{ background: C.cyanA(0.06), width: '65%' }} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLS.length}>
                                            <div className="py-16 flex flex-col items-center gap-3">
                                                <Package className="w-10 h-10" style={{ color: C.cyanA(0.2) }} />
                                                <p className="text-sm font-semibold" style={{ color: C.subtle }}>
                                                    {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((product, idx) => {
                                        const isLowStock = product.stock <= product.minStock;
                                        const isEven     = idx % 2 === 0;
                                        return (
                                            <tr key={product.id}
                                            style={{ borderBottom: '1px solid hsl(var(--border))', background: isEven ? 'transparent' : 'hsl(var(--muted) / 0.4)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.04)}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isEven ? 'transparent' : 'hsl(var(--muted) / 0.4)'}>

                                                {/* Producto */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name}
                                                                className="w-9 h-9 rounded-lg object-cover shrink-0"
                                                                style={{ border: `1px solid ${C.cyanA(0.15)}` }} />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                                                style={{ background: C.cyanA(0.06), border: `1px solid ${C.cyanA(0.12)}` }}>
                                                                <Package className="w-4 h-4" style={{ color: C.cyanA(0.4) }} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold" style={{ color: C.text }}>{product.name}</p>
                                                            {product.sku && <p className="text-[10px]" style={{ color: C.muted }}>SKU: {product.sku}</p>}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Barcode */}
                                                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[12px]" style={{ color: C.muted }}>
                                                    {product.barcode || <span style={{ color: C.subtle }}>—</span>}
                                                </td>

                                                {/* Categoría */}
                                                <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: C.muted }}>
                                                    {product.category?.name || <span style={{ color: C.subtle }}>—</span>}
                                                </td>

                                                {/* Precio */}
                                                <td className="px-5 py-3.5 whitespace-nowrap font-bold tabular-nums" style={{ color: C.text }}>
                                                    ${product.price.toLocaleString('es-CL')}
                                                </td>

                                                {/* Stock */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5" style={{ color: C.amber }} />}
                                                        <span className="font-bold tabular-nums"
                                                            style={{ color: product.stock === 0 ? C.red : isLowStock ? C.amber : C.text }}>
                                                            {product.stock}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Tipo */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={product.unitType === 'WEIGHT'
                                                            ? { background: C.violetA(0.12), color: C.violet, border: `1px solid ${C.violetA(0.25)}` }
                                                            : { background: C.cyanA(0.08),  color: C.cyan,   border: `1px solid ${C.cyanA(0.2)}`   }}>
                                                        {product.unitType === 'WEIGHT' ? 'Granel' : 'Unidad'}
                                                    </span>
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <ActionBtn onClick={() => handleEdit(product)} color={C.cyan} alphaFn={C.cyanA} title="Editar">
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </ActionBtn>
                                                        <ActionBtn onClick={() => handleKardex(product)} color={C.violet} alphaFn={C.violetA} title="Ver Kardex">
                                                            <History className="w-3.5 h-3.5" />
                                                        </ActionBtn>
                                                        <ActionBtn onClick={() => handleDelete(product)} color={C.red} alphaFn={C.redA} title="Eliminar" disabled={deleteProduct.isPending}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </ActionBtn>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {filtered.length > 0 && !isLoading && (
                        <div className="px-5 py-2.5 text-[11px] text-right"
                            style={{ borderTop: '1px solid hsl(var(--border))', color: C.muted }}>
                            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Modals */}
                <ProductFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setProductToEdit(null); }} initialData={productToEdit} />
                <InventoryKardexModal isOpen={isKardexOpen} onClose={() => { setIsKardexOpen(false); setProductForKardex(null); }} product={productForKardex} />
            </div>
        </DashboardLayout>
    );
}

// ── Reusable icon action button ────────────────────────────────────────────────
function ActionBtn({ onClick, color, alphaFn, title, disabled, children }: {
    onClick: () => void; color: string; alphaFn: (a: number) => string;
    title: string; disabled?: boolean; children: React.ReactNode;
}) {
    return (
        <button onClick={onClick} title={title} disabled={disabled}
            className="p-2 rounded-lg transition-all duration-150 disabled:opacity-40"
            style={{ background: alphaFn(0.08), border: `1px solid ${alphaFn(0.2)}`, color }}
            onMouseEnter={e => !disabled && ((e.currentTarget as HTMLElement).style.background = alphaFn(0.18))}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = alphaFn(0.08)}>
            {children}
        </button>
    );
}
