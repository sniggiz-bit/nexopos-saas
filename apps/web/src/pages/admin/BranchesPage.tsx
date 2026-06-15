import { useState } from 'react';
import { Plus, Store, Home } from 'lucide-react';
import { useBranches } from '../../hooks/useBranches';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
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
        } catch (_error) {
            // Error handled in hook
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 flex-1 min-h-[calc(100vh-4rem)] p-6 bg-card/[0.1]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Sucursales</h1>
                        <p className="text-gray-400 text-sm mt-1">Gestiona las diferentes ubicaciones de tu negocio</p>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,153,204,0.3)] transition-all font-semibold rounded-lg">
                                <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card/[0.95] border border-border text-foreground backdrop-blur-md">
                            <DialogHeader>
                                <DialogTitle className="text-foreground font-bold">Crear Nueva Sucursal</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-gray-400">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={newBranchData.name}
                                        onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                                        placeholder="Ej: Sucursal Centro"
                                        className="bg-card/[0.8] border border-border text-foreground focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-gray-400">Dirección (Opcional)</Label>
                                    <Input
                                        id="address"
                                        value={newBranchData.address}
                                        onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
                                        placeholder="Ej: Av. Principal 123"
                                        className="bg-card/[0.8] border border-border text-foreground focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC]"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-border text-gray-400 hover:bg-card hover:text-foreground">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,153,204,0.3)] transition-all font-semibold">
                                        {submitting ? 'Creando...' : 'Crear Sucursal'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-3 text-center py-10 text-gray-500">Cargando sucursales...</div>
                    ) : branches.length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-gray-500 border border-dashed border-border bg-muted/30 rounded-xl">
                            No hay sucursales registradas. Crea la primera.
                        </div>
                    ) : (
                        branches.map((branch) => (
                            <div key={branch.id} className="bg-card/[0.5] border border-border backdrop-blur-md rounded-xl p-6 hover:border-border hover:shadow-[0_0_15px_rgba(0,153,204,0.05)] transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-muted/30 border border-border rounded-lg text-[#0099CC]">
                                        <Store size={24} />
                                    </div>
                                    {branch.isMain && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgba(16,185,129,0.06)] text-[#10B981] border border-[rgba(16,185,129,0.15)]">
                                            <Home size={12} className="mr-1" /> Matriz
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{branch.name}</h3>
                                <p className="text-sm text-gray-400 mb-4">{branch.address || 'Sin dirección registrada'}</p>
                                <div className="pt-4 border-t border-border flex justify-between items-center text-xs text-gray-500 font-mono">
                                    <span>ID: {branch.id.substring(0, 8)}...</span>
                                    <span>Creado: {new Date(branch.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
