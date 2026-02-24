import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Users,
    Calendar,
    CheckCircle2,
    XCircle,
    Settings2,
    Info,
    Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import TenantSettingsPanel from '../../components/admin/TenantSettingsPanel';

interface TenantSettings {
    enableBoletaDte: boolean;
    enableFacturaDte: boolean;
    enableGuiaDespachoDte: boolean;
    enableNotaCreditoDte: boolean;
    maxBranches: number;
    maxRegisters: number;
    maxUsers: number;
    canHardDelete: boolean;
}

interface TenantDetail {
    id: string;
    name: string;
    slug: string;
    phone?: string;
    rut?: string;
    giro?: string;
    address?: string;
    createdAt: string;
    status: 'ACTIVE' | 'SUSPENDED';
    plan?: { name: string; price: number };
    settings: TenantSettings | null;
    _count: { users: number; branches: number };
    users: Array<{ id: string; name: string; email: string; role: string }>;
}

type Tab = 'info' | 'settings';

export default function TenantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [settings, setSettings] = useState<TenantSettings | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchTenant();
    }, [id]);

    const fetchTenant = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tenants/${id}`);
            setTenant(res.data);
            setSettings(res.data.settings ?? null);
        } catch (err) {
            console.error('Error loading tenant:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-neutral-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span>Cargando tenant…</span>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-3">
                <XCircle size={40} className="text-red-400 opacity-50" />
                <p>No se encontró el tenant.</p>
                <button onClick={() => navigate('/admin/tenants')} className="text-purple-400 hover:underline text-sm">
                    ← Volver a la lista
                </button>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'info', label: 'Información', icon: Info },
        { key: 'settings', label: 'Plan & Límites', icon: Settings2 },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/tenants')}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">ID: {tenant.id}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${tenant.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {tenant.status === 'ACTIVE'
                        ? <><CheckCircle2 size={12} /> Activo</>
                        : <><XCircle size={12} /> Suspendido</>
                    }
                </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Users, label: 'Usuarios', value: tenant._count?.users ?? 0, color: 'text-blue-400' },
                    { icon: Building2, label: 'Sucursales', value: tenant._count?.branches ?? 0, color: 'text-purple-400' },
                    { icon: Calendar, label: 'Plan', value: tenant.plan?.name ?? 'Sin plan', color: 'text-amber-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-neutral-900/50`}>
                            <Icon size={18} className={color} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">{label}</p>
                            <p className="text-lg font-bold text-white">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-700">
                <nav className="flex gap-1">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key
                                    ? 'border-purple-500 text-purple-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                                }`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-white mb-3">Datos del Negocio</h3>
                        {[
                            { label: 'Nombre', value: tenant.name },
                            { label: 'Slug', value: tenant.slug },
                            { label: 'RUT', value: tenant.rut ?? '—' },
                            { label: 'Giro', value: tenant.giro ?? '—' },
                            { label: 'Teléfono', value: tenant.phone ?? '—' },
                            { label: 'Dirección', value: tenant.address ?? '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-start">
                                <span className="text-xs text-neutral-500">{label}</span>
                                <span className="text-sm text-neutral-200 text-right max-w-[60%] break-words">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Owner / Users */}
                    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Usuarios</h3>
                        <div className="space-y-2">
                            {tenant.users?.length ? tenant.users.map((u) => (
                                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900/50">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300 uppercase flex-shrink-0">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-neutral-200 truncate">{u.name}</p>
                                        <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400 flex-shrink-0">{u.role}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-neutral-500">Sin usuarios.</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-neutral-700 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-neutral-500">Registrado el</span>
                                <span className="text-sm text-neutral-300">{new Date(tenant.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <TenantSettingsPanel
                    tenantId={tenant.id}
                    settings={settings}
                    onSaved={(updated) => setSettings(updated)}
                />
            )}
        </div>
    );
}
