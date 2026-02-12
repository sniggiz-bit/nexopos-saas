import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useProducts } from '../../hooks/useProducts';
import { useDeleteProduct } from '../../hooks/useDeleteProduct';
import { ProductFormModal } from '../../components/dashboard/ProductFormModal';
import { InventoryKardexModal } from '../../components/dashboard/InventoryKardexModal';
import { Plus, Search, Edit, Trash2, History } from 'lucide-react';
import type { Product } from '../../api/types';

export function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [productForKardex, setProductForKardex] = useState<Product | null>(null);

    const { data: products, isLoading } = useProducts();
    const deleteProduct = useDeleteProduct();

    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleEdit = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (product: Product) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) {
            await deleteProduct.mutateAsync(product.id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setProductToEdit(null);
    };

    const handleKardex = (product: Product) => {
        setProductForKardex(product);
        setIsKardexOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código de barras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setProductToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Producto
                    </button>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código de Barras
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        Cargando productos...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron productos
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {product.image && (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded object-cover mr-3"
                                                    />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                    {product.sku && (
                                                        <div className="text-sm text-gray-500">
                                                            SKU: {product.sku}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.barcode || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.category?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${product.price.toLocaleString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm ${product.stock <= product.minStock ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.unitType === 'WEIGHT'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {product.unitType === 'WEIGHT' ? 'Granel' : 'Unidad'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleKardex(product)}
                                                className="text-gray-600 hover:text-gray-900 mr-3"
                                                title="Ver Kardex"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                disabled={deleteProduct.isPending}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Product Form Modal */}
                <ProductFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={productToEdit}
                />

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
