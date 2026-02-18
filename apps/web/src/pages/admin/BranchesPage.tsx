import { useState } from 'react';
import { Plus, Store, Home } from 'lucide-react';
import { useBranches } from '../../hooks/useBranches';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '../../components/ui/dialog';

export default function BranchesPage() {
    const { branches, loading, createBranch } = useBranches();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBranchData, setNewBranchData] = useState({ name: '', address: '', isMain: false });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createBranch(newBranchData);
            setIsModalOpen(false);
            setNewBranchData({ name: '', address: '', isMain: false });
        } catch (error) {
            // Error handled in hook
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sucursales</h1>
                    <p className="text-neutral-400">Gestiona las diferentes ubicaciones de tu negocio</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Crear Nueva Sucursal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={newBranchData.name}
                                    onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                                    placeholder="Ej: Sucursal Centro"
                                    className="bg-neutral-800 border-neutral-700"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección (Opcional)</Label>
                                <Input
                                    id="address"
                                    value={newBranchData.address}
                                    onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
                                    placeholder="Ej: Av. Principal 123"
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>
                            {/* Checkbox for isMain could go here but usually set once by system or during onboarding */}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    {submitting ? 'Creando...' : 'Crear Sucursal'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 text-center py-10 text-neutral-500">Cargando sucursales...</div>
                ) : branches.length === 0 ? (
                    <div className="col-span-3 text-center py-10 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                        No hay sucursales registradas. Crea la primera.
                    </div>
                ) : (
                    branches.map((branch) => (
                        <div key={branch.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Store size={24} />
                                </div>
                                {branch.isMain && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <Home size={12} className="mr-1" /> Matriz
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{branch.name}</h3>
                            <p className="text-sm text-neutral-400 mb-4">{branch.address || 'Sin dirección registrada'}</p>
                            <div className="pt-4 border-t border-neutral-700 flex justify-between items-center text-xs text-neutral-500">
                                <span>ID: {branch.id.substring(0, 8)}...</span>
                                <span>Creado: {new Date(branch.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
