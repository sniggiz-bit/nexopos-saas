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
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertTriangle className="text-red-600 w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Productos con Stock Crítico
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Estos productos están por debajo de su stock mínimo definido y requieren reposición.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-bold border border-red-100 shadow-sm">
                            {products?.length || 0} Productos en alerta
                        </span>
                        <Link
                            to="/dashboard/inventory"
                            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-50 flex items-center shadow-sm"
                        >
                            Ver Inventario General
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                </div>

                <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identificadores</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Mínimo Requerido</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridad</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {products?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                                <Package className="h-10 w-10 text-green-500" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">¡Todo en orden!</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto">
                                                No hay productos con stock crítico actualmente. Todos tus niveles están optimizados.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products?.map((product) => (
                                    <tr key={product.id} className="hover:bg-red-50/30 transition-colors duration-150">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                                                    {product.image ? (
                                                        <img className="h-full w-full object-cover" src={product.image} alt="" />
                                                    ) : (
                                                        <Package className="h-full w-full p-2.5 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-blue-600 font-medium">{product.category?.name || 'Snacks'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-xs font-mono text-gray-600 font-medium">SKU: {product.sku || '-'}</div>
                                            <div className="text-xs font-mono text-gray-400">BC: {product.barcode}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className={`text-base font-black ${product.stock <= 0 ? 'text-red-700' : 'text-red-500'}`}>
                                                {product.stock} {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                                            {product.minStock} {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            {product.stock <= 0 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-sm shadow-red-200">
                                                    URGENTE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
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
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900">Sugerencia de Reposición</h4>
                            <p className="text-blue-800 text-sm mt-1">
                                Para normalizar estos niveles, te recomendamos generar órdenes de compra para alcanzar al menos un 20% por encima del stock mínimo en cada producto.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
