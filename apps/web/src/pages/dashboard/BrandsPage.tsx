import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../../api/brands';
import type { Brand } from '../../api/brands';
import { Plus, Edit, Trash2, Loader2, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const loadBrands = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBrands();
            setBrands(data);
        } catch {
            toast.error('Error al cargar las marcas');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingBrand) {
                const updated = await updateBrand(editingBrand.id, { name });
                setBrands(prev => prev.map(b => b.id === updated.id ? updated : b));
                toast.success('Marca actualizada exitosamente');
            } else {
                const created = await createBrand({ name });
                setBrands(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                toast.success('Marca creada exitosamente');
            }
            handleClose();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al guardar la marca';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setName(brand.name);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, brandName: string) => {
        if (!window.confirm(`¿Eliminar la marca "${brandName}"?`)) return;
        setBrands(prev => prev.filter(b => b.id !== id));
        try {
            await deleteBrand(id);
            toast.success('Marca eliminada exitosamente');
        } catch (error: any) {
            await loadBrands();
            toast.error(error.response?.data?.message || 'Error al eliminar la marca');
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
        setName('');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                        Gestiona las marcas de tus productos para una mejor clasificación.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Marca
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre de Marca</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                                        <p className="mt-2 text-gray-500">Cargando marcas...</p>
                                    </td>
                                </tr>
                            ) : brands.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                        <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        No hay marcas registradas en este sistema.
                                    </td>
                                </tr>
                            ) : (
                                brands.map((brand) => (
                                    <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 font-bold text-xs">
                                                {brand.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {brand.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-indigo-100">
                                                {brand.productCount || 0} productos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(brand)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 hover:bg-indigo-50 rounded"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(brand.id, brand.name)}
                                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
                            </h3>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Nombre de la Marca
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej: CCU, Nestlé, Evercrisp..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-indigo-200"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingBrand ? 'Guardar Cambios' : 'Crear Marca'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
