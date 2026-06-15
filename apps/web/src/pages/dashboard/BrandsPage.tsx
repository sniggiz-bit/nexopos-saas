import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '../../hooks/useBrands';
import type { Brand } from '../../api/brands';
import { Plus, Edit, Trash2, Loader2, Tag, RefreshCw } from 'lucide-react';

export function BrandsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [name, setName] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: brands = [], isLoading, isError, refetch } = useBrands();
    const createBrand = useCreateBrand();
    const updateBrand = useUpdateBrand();
    const deleteBrand = useDeleteBrand();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editingBrand) {
            await updateBrand.mutateAsync({ id: editingBrand.id, data: { name } });
        } else {
            await createBrand.mutateAsync({ name });
        }
        refetch();
        handleClose();
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setName(brand.name);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(null);
        await deleteBrand.mutateAsync(id);
        refetch();
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
        setName('');
    };

    const isSaving = createBrand.isPending || updateBrand.isPending;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Marcas de Productos</h1>
                        <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                            Gestiona las marcas de tus productos para una mejor clasificación
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isError && (
                            <button
                                onClick={() => refetch()}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border text-foreground/[0.85] rounded-lg hover:bg-[#0099CC]/5 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reintentar
                            </button>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold rounded-lg transition-all flex items-center shadow-[0_0_15px_rgba(0,153,204,0.2)] hover:shadow-[0_0_25px_rgba(0,153,204,0.4)]"
                        >
                            <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                            Nueva Marca
                        </button>
                    </div>
                </div>

                <div className="rounded-xl overflow-hidden animate-fade-up bg-card border border-border">
                    <table className="min-w-full divide-y divide-border">
                        <thead style={{ background: 'hsl(var(--background))' }}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre de Marca</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Productos</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#0099CC] mx-auto" />
                                        <p className="mt-2 text-sm text-muted-foreground/[0.5]">Cargando marcas...</p>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground/[0.5]">
                                        <Tag className="w-12 h-12 text-red-400/20 mx-auto mb-3" />
                                        <p className="text-red-400 font-medium">Error al cargar las marcas</p>
                                        <button onClick={() => refetch()} className="mt-3 text-sm text-[#0099CC] hover:underline">
                                            Intentar nuevamente
                                        </button>
                                    </td>
                                </tr>
                            ) : brands.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground/[0.4]">
                                        <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        No hay marcas registradas en este sistema.
                                    </td>
                                </tr>
                            ) : (
                                brands.map((brand) => (
                                    <tr key={brand.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground/[0.9] flex items-center">
                                            <div className="w-8 h-8 rounded-lg bg-[#0099CC]/10 text-[#0099CC] border border-[#0099CC]/20 flex items-center justify-center mr-3 font-bold text-xs">
                                                {brand.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {brand.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-50">
                                            <span className="bg-[#0099CC]/10 text-[#0099CC] px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#0099CC]/20">
                                                {brand.productCount || 0} productos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(brand)}
                                                className="text-[#0099CC] hover:text-white mr-4 p-2 hover:bg-[#0099CC]/10 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {deletingId === brand.id ? (
                                                <span className="inline-flex gap-1">
                                                    <button onClick={() => handleDelete(brand.id)} className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all">Sí</button>
                                                    <button onClick={() => setDeletingId(null)} className="text-xs px-2.5 py-1 bg-card border border-border text-foreground/[0.85] rounded-lg hover:bg-card transition-all">No</button>
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setDeletingId(brand.id)}
                                                    className="text-red-400 hover:text-white p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border bg-[hsl(var(--card))]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="text-lg font-bold text-foreground">
                                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
                            </h3>
                            <button onClick={handleClose} className="text-muted-foreground/[0.6] hover:text-foreground">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">
                                    Nombre de la Marca
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: CCU, Nestlé, Evercrisp..."
                                    className="w-full px-4 py-2 bg-card border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#0099CC] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 border border-border text-foreground/[0.85] hover:bg-[#0099CC]/5 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] rounded-lg font-bold transition-all disabled:opacity-50 flex items-center shadow-[0_0_15px_rgba(0,153,204,0.15)]"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0B0F1A]" />}
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
