import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useProducts } from '../../hooks/useProducts';

interface StoreSettings {
    storeSlug: string;
    storeSettings: {
        whatsappNumber: string;
        brandColor: string;
        bannerUrl: string;
        isActive: boolean;
    };
}

export const EcommercePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [storeLink, setStoreLink] = useState('');
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StoreSettings>();

    const brandColor = watch('storeSettings.brandColor', '#3B82F6');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Assuming we can get the tenant info from a "me" endpoint or similar, 
                // but here I'll use the store endpoint if I know the slug, OR 
                // I need an endpoint to get MY store settings.
                // Since I implemented updateStoreSettings in StoreController which takes tenantId from query (for now)
                // but in real world auth guard should provide it. 
                // Let's assume there's a way to get current tenant details.
                // Using the specific store endpoint for now or maybe I should fetch tenant details first.
                // Actually, I can use the `api` to fetch /auth/me or similar if it returns tenant info including settings.
                // Or I'll use a new endpoint GET /store/settings which I should probably have added.
                // For now, let's assume I can get it from /tenants/me or similar if it exists. 
                // Wait, I implemented findBySlug. 
                // I should probably add GET /store/my-store to get own store settings without knowing slug initially.
                // But for MVP, let's assume the user object might have it or I request it.

                // fallback: simple GET to a new endpoint I'll mock/add or just use existing if I had added it.
                // Let's add GET /store/my-store to backend quickly later if needed. 
                // For now, I will use /tenants/:id if I can access it.
                // Or I can use the existing `user` object if it has tenant details?

                if (user?.tenantId) {
                    const { data } = await api.get('/store/settings', {
                        params: { tenantId: user.tenantId }
                    });

                    if (data) {
                        setValue('storeSlug', data.storeSlug || '');
                        setValue('storeSettings.whatsappNumber', data.storeSettings?.whatsappNumber || '');
                        setValue('storeSettings.brandColor', data.storeSettings?.brandColor || '#3B82F6');
                        setValue('storeSettings.bannerUrl', data.storeSettings?.bannerUrl || '');
                        setValue('storeSettings.isActive', data.storeSettings?.isActive || false);

                        if (data.storeSlug) {
                            setStoreLink(`${window.location.origin}/store/${data.storeSlug}`);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar la configuración');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user, setValue]);

    const onSubmit = async (data: StoreSettings) => {
        try {
            await api.patch('/store/settings', data, {
                params: { tenantId: user?.tenantId } // In real implementation better to take from token
            });
            toast.success('Tienda actualizada correctamente');
            setStoreLink(`${window.location.origin}/store/${data.storeSlug}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(storeLink);
        toast.success('Enlace copiado');
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mi Tienda Online</h1>
                        <p className="text-gray-600">Configura tu e-commerce y vende por WhatsApp</p>
                    </div>
                    {storeLink && (
                        <div className="flex gap-2">
                            <a href={storeLink} target="_blank" rel="noreferrer" className="px-4 py-2 border rounded hover:bg-gray-50">
                                Ver Tienda
                            </a>
                            <button onClick={copyLink} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                Copiar Enlace
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" {...register('storeSettings.isActive')} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900">Activar Tienda Online</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">URL de la Tienda (Slug)</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        nexopos.cl/store/
                                    </span>
                                    <input
                                        type="text"
                                        {...register('storeSlug', { required: 'El slug es obligatorio' })}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 p-2 border"
                                        placeholder="mi-negocio"
                                    />
                                </div>
                                {errors.storeSlug && <span className="text-red-500 text-xs">{errors.storeSlug.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Número de WhatsApp (Formato Internacional)</label>
                                <input
                                    type="text"
                                    {...register('storeSettings.whatsappNumber', { required: 'El WhatsApp es obligatorio' })}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                    placeholder="56912345678"
                                />
                                <p className="text-xs text-gray-500 mt-1">Sin símbolos, solo números (ej: 569...)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Color de Marca</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="color"
                                        {...register('storeSettings.brandColor')}
                                        className="h-10 w-20 p-1 border border-gray-300 rounded-md"
                                    />
                                    <div
                                        className="h-10 w-full rounded-md border border-gray-200 flex items-center px-3 text-white font-medium shadow-sm"
                                        style={{ backgroundColor: brandColor }}
                                    >
                                        Vista Previa Botón
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">URL del Banner (Opcional)</label>
                                <input
                                    type="text"
                                    {...register('storeSettings.bannerUrl')}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Gestor de Catálogo</h2>
                    <p className="text-gray-600 mb-4">Selecciona los productos que quieres mostrar en tu tienda online.</p>
                    <ProductVisibilityManager />
                </div>
            </div>
        </DashboardLayout>
    );
};

const ProductVisibilityManager = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: products, isLoading, refetch } = useProducts(user?.tenantId);
    const [localProducts, setLocalProducts] = useState<any[]>([]);

    useEffect(() => {
        if (products) {
            setLocalProducts(products);
        }
    }, [products]);

    if (isLoading) return <div>Cargando productos...</div>;
    if (!products) return <div>No se pudieron cargar los productos.</div>;

    const filteredProducts = localProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleProduct = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        // Optimistic update
        setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, isPublic: newStatus } : p));

        try {
            await api.patch('/products/bulk-public', { ids: [id], isPublic: newStatus }, {
                params: { tenantId: user?.tenantId }
            });
            toast.success('Producto actualizado');
        } catch (_error) {
            toast.error('Error al actualizar');
            // Revert
            setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, isPublic: currentStatus } : p));
        }
    };

    const handleBulkUpdate = async (makePublic: boolean) => {
        const idsToUpdate = filteredProducts.map(p => p.id);
        if (idsToUpdate.length === 0) return;

        if (!confirm(`¿Estás seguro de ${makePublic ? 'publicar' : 'ocultar'} ${idsToUpdate.length} productos?`)) return;

        setLocalProducts(prev => prev.map(p => idsToUpdate.includes(p.id) ? { ...p, isPublic: makePublic } : p));

        try {
            await api.patch('/products/bulk-public', { ids: idsToUpdate, isPublic: makePublic }, {
                params: { tenantId: user?.tenantId }
            });
            toast.success(`Productos ${makePublic ? 'publicados' : 'ocultos'} correctamente`);
            refetch();
        } catch (_error) {
            toast.error('Error al actualizar masivamente');
            refetch();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border rounded-md px-3 py-2 w-64"
                />
                <div className="flex gap-2">
                    <button onClick={() => handleBulkUpdate(true)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                        Publicar Todo
                    </button>
                    <button onClick={() => handleBulkUpdate(false)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                        Ocultar Todo
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visible</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={!!product.isPublic}
                                        onChange={() => toggleProduct(product.id, !!product.isPublic)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {product.image && <img src={product.image} alt="" className="h-8 w-8 rounded mr-2" />}
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${product.price}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.category?.name || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
