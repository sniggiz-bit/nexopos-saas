import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export function CategoriesPage() {
    const { data: categories, isLoading, refetch } = useCategories();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            await updateCategory.mutateAsync({ id: editingCategory.id, data: { name } });
        } else {
            await createCategory.mutateAsync({ name });
        }
        await refetch();
        handleClose();
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setName(category.name);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"?`)) {
            await deleteCategory.mutateAsync(id);
            await refetch();
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setName('');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Categorías de Productos</h1>
                        <p className="text-[13px] text-[rgba(180,195,220,0.5)] mt-1">
                            Gestiona las categorías de productos para organizar tu minimarket
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold rounded-lg transition-all flex items-center shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)]"
                    >
                        <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                        Nueva Categoría
                    </button>
                </div>

                <div className="rounded-xl overflow-hidden animate-fade-up" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.08)' }}>
                    <table className="min-w-full divide-y divide-[rgba(0,212,255,0.06)]">
                        <thead style={{ background: 'rgba(0,212,255,0.04)' }}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[rgba(0,212,255,0.6)] uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[rgba(0,212,255,0.6)] uppercase tracking-wider">Productos Asociados</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-[rgba(0,212,255,0.6)] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(0,212,255,0.06)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF] mx-auto" />
                                        <p className="mt-2 text-sm text-[rgba(180,195,220,0.5)]">Cargando categorías...</p>
                                    </td>
                                </tr>
                            ) : !categories || categories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-[rgba(180,195,220,0.4)]">
                                        No hay categorías creadas. Comienza agregando una nueva.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-[rgba(0,212,255,0.02)] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[rgba(210,225,245,0.9)]">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-50">
                                            <span className="bg-[#00D4FF]/10 text-[#00D4FF] px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#00D4FF]/20">
                                                {category.productCount || 0} productos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-[#00D4FF] hover:text-white mr-4 p-2 hover:bg-[#00D4FF]/10 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id, category.name)}
                                                className="text-red-400 hover:text-white p-2 hover:bg-red-500/10 rounded-lg transition-colors"
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

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[rgba(0,212,255,0.15)] bg-[hsl(220,25%,9%)]">
                        <div className="px-6 py-4 border-b border-[rgba(0,212,255,0.08)] flex justify-between items-center bg-[rgba(0,212,255,0.02)]">
                            <h3 className="text-lg font-bold text-white">
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h3>
                            <button onClick={handleClose} className="text-[rgba(180,195,220,0.6)] hover:text-white">
                                <Plus className="w-6 h-6 rotate-45" />
                              </button>
                          </div>
                          <form onSubmit={handleSubmit} className="p-6">
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-semibold text-[rgba(210,225,245,0.85)] mb-1">
                                          Nombre de la Categoría
                                      </label>
                                      <input
                                          autoFocus
                                          type="text"
                                          required
                                          value={name}
                                          onChange={(e) => setName(e.target.value)}
                                          placeholder="Ej: Bebidas, Lácteos, Snacks..."
                                          className="w-full px-4 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(0,212,255,0.15)] text-white rounded-lg focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-[rgba(180,195,220,0.3)]"
                                      />
                                  </div>
                              </div>
                              <div className="mt-8 flex justify-end gap-3">
                                  <button
                                      type="button"
                                      onClick={handleClose}
                                      className="px-4 py-2 border border-[rgba(0,212,255,0.15)] text-[rgba(210,225,245,0.85)] hover:bg-[#00D4FF]/5 rounded-lg font-medium transition-colors"
                                  >
                                      Cancelar
                                  </button>
                                  <button
                                      type="submit"
                                      disabled={createCategory.isPending || updateCategory.isPending}
                                      className="px-6 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] rounded-lg font-bold transition-all disabled:opacity-50 flex items-center shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                                  >
                                      {(createCategory.isPending || updateCategory.isPending) && (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0B0F1A]" />
                                      )}
                                      {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}
        </DashboardLayout>
    );
}
