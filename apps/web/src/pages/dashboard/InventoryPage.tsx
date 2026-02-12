import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useProducts } from '../../hooks/useProducts';
import { InventoryKardexModal } from '../../components/dashboard/InventoryKardexModal';
import { Search, History, Loader2, Warehouse, ArrowUpDown, AlertCircle } from 'lucide-react';
import type { Product } from '../../api/types';

export function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [productForKardex, setProductForKardex] = useState<Product | null>(null);

    const { data: products, isLoading } = useProducts();

    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleKardex = (product: Product) => {
        setProductForKardex(product);
        setIsKardexOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-gray-600">
                        Consulta y gestiona los niveles de stock de todos tus productos en tiempo real.
                    </p>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, SKU o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Identificadores</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                        <p className="mt-2 text-gray-500">Cargando inventario...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Warehouse className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        No se encontraron productos en el inventario.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Warehouse className="w-full h-full p-2 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500">{product.category?.name || 'Sin Categoría'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs font-mono text-gray-600">SKU: {product.sku || '-'}</div>
                                            <div className="text-xs font-mono text-gray-600">EAN: {product.barcode || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`text-lg font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {product.stock}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-1">
                                                {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {product.stock <= 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Agotado
                                                </span>
                                            ) : product.stock <= product.minStock ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Stock Bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    Suficiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleKardex(product)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm text-xs font-bold"
                                            >
                                                <History className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                                Ver Kardex
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <InventoryKardexModal
                    isOpen={isKardexOpen}
                    onClose={() => {
                        setIsKardexOpen(false);
                        setProductForKardex(null);
                    }}
                    product={productForKardex}
                />
            </div>
        </DashboardLayout>
    );
}
