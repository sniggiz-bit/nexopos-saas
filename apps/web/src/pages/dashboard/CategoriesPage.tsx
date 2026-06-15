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
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorías de Productos</h1>
                        <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                            Gestiona las categorías de productos para organizar tu minimarket
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold rounded-lg transition-all flex items-center shadow-[0_0_15px_rgba(0,153,204,0.2)] hover:shadow-[0_0_25px_rgba(0,153,204,0.4)]"
                    >
                        <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                        Nueva Categoría
                    </button>
                </div>

                <div className="rounded-xl overflow-hidden animate-fade-up bg-card border border-border">
                    <table className="min-w-full divide-y divide-border">
                        <thead style={{ background: 'hsl(var(--background))' }}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Productos Asociados</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#0099CC] mx-auto" />
                                        <p className="mt-2 text-sm text-muted-foreground/[0.5]">Cargando categorías...</p>
                                    </td>
                                </tr>
                            ) : !categories || categories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground/[0.4]">
                                        No hay categorías creadas. Comienza agregando una nueva.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground/[0.9]">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-50">
                                            <span className="bg-[#0099CC]/10 text-[#0099CC] px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#0099CC]/20">
                                                {category.productCount || 0} productos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-[#0099CC] hover:text-white mr-4 p-2 hover:bg-[#0099CC]/10 rounded-lg transition-colors"
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
                    <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border bg-[hsl(var(--card))]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="text-lg font-bold text-foreground">
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h3>
                            <button onClick={handleClose} className="text-muted-foreground/[0.6] hover:text-foreground">
                                <Plus className="w-6 h-6 rotate-45" />
                              </button>
                          </div>
                          <form onSubmit={handleSubmit} className="p-6">
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">
                                          Nombre de la Categoría
                                      </label>
                                      <input
                                          autoFocus
                                          type="text"
                                          required
                                          value={name}
                                          onChange={(e) => setName(e.target.value)}
                                          placeholder="Ej: Bebidas, Lácteos, Snacks..."
                                          className="w-full px-4 py-2 bg-card border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#0099CC] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                      />
                                  </div>
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
                                      disabled={createCategory.isPending || updateCategory.isPending}
                                      className="px-6 py-2 bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] rounded-lg font-bold transition-all disabled:opacity-50 flex items-center shadow-[0_0_15px_rgba(0,153,204,0.15)]"
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
