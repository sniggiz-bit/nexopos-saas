import { useState } from 'react';
import { Search, Store, Building2, MapPin, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useSuperAdminBranches } from '../../hooks/useSuperAdminBranches';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';

export default function SuperAdminBranchesPage() {
    const { branches, loading, toggleBranchStatus } = useSuperAdminBranches();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleBranchStatus(id, !currentStatus);
        } catch (_error) {
            // Error managed by hook toast
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Building2 className="text-purple-500" /> Gestión Global de Sucursales
                    </h1>
                    <p className="text-neutral-400">Control de habilitación de locales para todos los clientes</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <Input
                        placeholder="Buscar por nombre o tenant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-neutral-800 border-neutral-700"
                    />
                </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/50 border-b border-neutral-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sucursal</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Tenant / Cliente</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center">Estado SaaS</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            Cargando sucursales...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                        No se encontraron sucursales.
                                    </td>
                                </tr>
                            ) : (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                                                    <Store size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{branch.name}</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-tighter">ID: {branch.id.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-neutral-200">{branch.tenant.name}</span>
                                                <span className="text-[10px] text-neutral-500 uppercase tracking-tighter">ID: {branch.tenantId.substring(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                                                <MapPin size={14} className="text-neutral-600" />
                                                {branch.address || <span className="text-neutral-600 italic">Sin dirección</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-2">
                                                <Switch
                                                    checked={branch.isActive}
                                                    onChange={() => handleToggle(branch.id, branch.isActive)}
                                                    className="scale-110"
                                                />
                                                <Badge
                                                    variant="outline"
                                                    className={branch.isActive
                                                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/5 text-red-400 border-red-500/20'
                                                    }
                                                >
                                                    {branch.isActive ? (
                                                        <span className="flex items-center gap-1"><ShieldCheck size={10} /> Activa</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><ShieldAlert size={10} /> Inactiva</span>
                                                    )}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-neutral-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-neutral-600" />
                                                {new Date(branch.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
