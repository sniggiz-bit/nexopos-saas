import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { useProducts } from '../../hooks/useProducts';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function CriticalStockPage() {
    const { user } = useAuth();
    const tenantId = user?.tenantId ?? '';
    const { data: allProducts, isLoading } = useProducts(tenantId);
    const products = (allProducts ?? []).filter(p => p.isActive && p.stock <= p.minStock);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoadingSpinner />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertTriangle className="text-red-400 w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Productos con Stock Crítico
                            </h1>
                            <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                                Estos productos están por debajo de su stock mínimo definido y requieren reposición.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/20 shadow-sm">
                            {products?.length || 0} Productos en alerta
                        </span>
                        <Link
                            to="/dashboard/inventory"
                            className="bg-card border border-border text-foreground/[0.85] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00D4FF]/5 flex items-center shadow-sm transition-all"
                        >
                            Ver Inventario General
                            <ArrowRight className="w-4 h-4 ml-2 text-[#00D4FF]" />
                        </Link>
                    </div>
                </div>

                <div className="rounded-xl overflow-hidden animate-fade-up shadow-[0_0_30px_rgba(239,68,68,0.02)]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <table className="min-w-full divide-y divide-[rgba(239,68,68,0.1)]">
                        <thead style={{ background: 'rgba(239,68,68,0.04)' }}>
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-red-400/80 uppercase tracking-wider">Producto</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-red-400/80 uppercase tracking-wider">Identificadores</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-red-400/80 uppercase tracking-wider">Stock Actual</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-red-400/80 uppercase tracking-wider">Mínimo Requerido</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-red-400/80 uppercase tracking-wider">Prioridad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(239,68,68,0.08)]">
                            {products?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                                <Package className="h-10 w-10 text-emerald-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground">¡Todo en orden!</h3>
                                            <p className="text-sm mt-1 text-muted-foreground/[0.5] max-w-xs mx-auto">
                                                No hay productos con stock crítico actualmente. Todos tus niveles están optimizados.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products?.map((product) => (
                                    <tr key={product.id} className="hover:bg-red-500/5 transition-colors duration-150">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-xl border border-border overflow-hidden bg-card flex-shrink-0 flex items-center justify-center">
                                                    {product.image ? (
                                                        <img className="h-full w-full object-cover" src={product.image} alt="" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-foreground/[0.95]">{product.name}</div>
                                                    <div className="text-xs text-[#00D4FF] font-semibold">{product.category?.name || 'Snacks'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-xs font-mono text-foreground/[0.7] font-medium">SKU: {product.sku || '-'}</div>
                                            <div className="text-xs font-mono text-muted-foreground/[0.4]">BC: {product.barcode}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className={`text-base font-black tabular-nums ${product.stock <= 0 ? 'text-red-400' : 'text-rose-400'}`}>
                                                {product.stock} {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-bold text-foreground/[0.85]">
                                            {product.minStock} {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            {product.stock <= 0 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm">
                                                    URGENTE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                                    REABASTECER
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Reposición Tips */}
                {products && products.length > 0 && (
                    <div className="rounded-xl p-6 border border-[#00D4FF]/15 bg-[#00D4FF]/5 flex items-start gap-4 animate-fade-up">
                        <div className="p-2.5 bg-[#00D4FF] rounded-lg text-[#0B0F1A]">
                            <Package className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Sugerencia de Reposición</h4>
                            <p className="text-foreground/[0.85] text-sm mt-1">
                                Para normalizar estos niveles, te recomendamos generar órdenes de compra para alcanzar al menos un 20% por encima del stock mínimo en cada producto.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
