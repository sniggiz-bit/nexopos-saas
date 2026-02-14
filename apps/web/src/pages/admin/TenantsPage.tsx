import { useEffect, useState } from 'react';
import { Search, MoreVertical, LogIn, Ban, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Tenant {
    id: string;
    name: string;
    createdAt: string;
    owner: {
        name: string;
        email: string;
    };
    _count: {
        users: number;
        branches: number;
    };
    status: 'ACTIVE' | 'SUSPENDED'; // Placeholder type
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { login } = useAuth(); // We might need a raw login function or use the token directly
    const navigate = useNavigate();

    useEffect(() => {
        fetchTenants();
    }, [searchTerm]);

    const fetchTenants = async () => {
        try {
            const response = await api.get('/tenants', {
                params: { search: searchTerm }
            });
            // Backend returns array directly now
            const rawTenants = response.data;

            // Map backend structure to frontend interface
            // Backend returns: users: [ { id, name, email } ] if they are ADMINs
            const mappedTenants = rawTenants.map((t: any) => ({
                ...t,
                owner: t.users?.[0] || { id: null, name: 'Sin Dueño', email: 'N/A' }
            }));

            setTenants(mappedTenants);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async (tenant: Tenant) => {
        // Logic for impersonation
        // 1. Get the admin user ID for this tenant (we fetched owner)
        // Wait, we need the user ID to impersonate. The backend returns `owner` object. 
        // I should update the backend to return owner ID or just pick the first user.
        // The backend returns: owner: t.users[0] || { name: 'N/A', email: 'N/A' }
        // It doesn't include ID. I need to fix the backend service first or assume I have it.
        // Let's assume I'll fix the backend to return ID.

        try {
            // Assuming I can get the ID somehow, or I need to fetch it. 
            // Actually, let's fix the backend service to return the ID in the owner object.
            // coping with what I have: I'll assume the owner object has an ID in the updated backend.

            // Temporary fix: fail if no ID
            // console.log('Impersonating', tenant.owner);

            // Let's optimisticly retry fetching or just call the endpoint if I had the ID.
            // Since I can't easily change the backend *right now* smoothly without context switching, 
            // I'll write the frontend code assuming `tenant.owner.id` exists and then I will go fix the backend service.

            if (!tenant.owner || !(tenant.owner as any).id) {
                alert('No se puede encontrar el usuario administrador de este tenant.');
                return;
            }

            const response = await api.post(`/auth/impersonate/${(tenant.owner as any).id}`);

            if (response.data.access_token) {
                // Store the token
                localStorage.setItem('token', response.data.access_token);
                // Set a flag for impersonation to show the banner
                localStorage.setItem('impersonating', 'true');
                // Reload or navigate to dashboard
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Impersonation failed', error);
            alert('Fallo al iniciar sesión como cliente.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Gestión de Tenants</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-purple-500 w-64"
                    />
                </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Empresa</th>
                            <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Dueño</th>
                            <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Métricas</th>
                            <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Registro</th>
                            <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Cargando...</td></tr>
                        ) : tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-neutral-750 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{tenant.name}</div>
                                    <div className="text-xs text-neutral-500">ID: {tenant.id.substring(0, 8)}...</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-neutral-300">{tenant.owner?.name || 'N/A'}</div>
                                    <div className="text-xs text-neutral-500">{tenant.owner?.email || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                        {tenant.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-neutral-400">
                                    <div className="flex gap-4">
                                        <span title="Usuarios">👥 {tenant._count.users}</span>
                                        <span title="Sucursales">🏢 {tenant._count.branches}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-neutral-400">
                                    {new Date(tenant.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleImpersonate(tenant)}
                                            className="p-1.5 hover:bg-purple-900/30 text-purple-400 rounded-lg transition-colors"
                                            title="Acceder como este cliente"
                                        >
                                            <LogIn size={18} />
                                        </button>
                                        <button className="p-1.5 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors" title="Suspender">
                                            <Ban size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
