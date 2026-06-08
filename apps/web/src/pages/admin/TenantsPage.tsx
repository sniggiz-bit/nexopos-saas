import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogIn, Ban, CheckCircle, ChevronLeft, ChevronRight, Package, Users, GitBranch, ExternalLink } from 'lucide-react';
import api from '../../lib/api';

interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  status: 'ACTIVE' | 'SUSPENDED';
  owner: { id: string | null; name: string; email: string };
  plan: { id: string; name: string; price: number } | null;
  _count: { users: number; branches: number; products: number };
}

export default function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchTenants();
  }, [searchTerm, page]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tenants', {
        params: { search: searchTerm || undefined, page, limit: 15 },
      });
      setTenants(res.data.data);
      setTotal(res.data.total);
      setLastPage(res.data.lastPage);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenant.owner?.id) {
      alert('Este tenant no tiene un administrador asignado.');
      return;
    }
    try {
      const prevToken = localStorage.getItem('token');
      const prevUser = localStorage.getItem('user');
      if (prevToken) localStorage.setItem('__prev_session_token', prevToken);
      if (prevUser) localStorage.setItem('__prev_session_user', prevUser);
      
      const res = await api.post(`/auth/impersonate/${tenant.owner.id}`);
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('impersonating', tenant.name);
        window.location.href = '/dashboard';
      }
    } catch {
      alert('No se pudo acceder como este cliente.');
    }
  };

  const handleToggleStatus = async (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const label = newStatus === 'SUSPENDED' ? 'suspender' : 'activar';
    if (!confirm(`¿Seguro que deseas ${label} a ${tenant.name}?`)) return;
    try {
      await api.patch(`/admin/tenants/${tenant.id}/status`, { status: newStatus });
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t));
    } catch {
      alert('Error al cambiar el estado del tenant.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Clientes</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} empresa{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 w-72"
          />
        </div>
      </div>

      <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-900 border-b border-neutral-700">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Empresa</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Administrador</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Recursos</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Registro</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">Cargando...</td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">No se encontraron resultados.</td>
              </tr>
            ) : tenants.map(tenant => (
              <tr
                key={tenant.id}
                onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                className="hover:bg-neutral-700/30 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{tenant.name}</div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">{tenant.id.substring(0, 8)}…</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-neutral-300">{tenant.owner?.name || '—'}</div>
                  <div className="text-xs text-neutral-500">{tenant.owner?.email || '—'}</div>
                </td>
                <td className="px-5 py-4">
                  {tenant.plan ? (
                    <div>
                      <div className="text-sm text-neutral-300">{tenant.plan.name}</div>
                      <div className="text-xs text-neutral-500">${tenant.plan.price.toLocaleString('es-CL')}/mes</div>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-600">Sin plan</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Users size={12} />{tenant._count.users}</span>
                    <span className="flex items-center gap-1"><GitBranch size={12} />{tenant._count.branches}</span>
                    <span className="flex items-center gap-1"><Package size={12} />{tenant._count.products}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {tenant.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-neutral-500">
                  {new Date(tenant.createdAt).toLocaleDateString('es-CL')}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                      className="p-1.5 hover:bg-blue-900/40 text-blue-400 rounded-lg transition-colors"
                      title="Ver detalle / Módulos SaaS"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={e => handleImpersonate(tenant, e)}
                      className="p-1.5 hover:bg-purple-900/40 text-purple-400 rounded-lg transition-colors"
                      title="Acceder como este cliente"
                    >
                      <LogIn size={16} />
                    </button>
                    <button
                      onClick={e => handleToggleStatus(tenant, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        tenant.status === 'ACTIVE'
                          ? 'hover:bg-red-900/40 text-red-400'
                          : 'hover:bg-emerald-900/40 text-emerald-400'
                      }`}
                      title={tenant.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                    >
                      {tenant.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-700 bg-neutral-900/40">
            <span className="text-xs text-neutral-500">Página {page} de {lastPage}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
