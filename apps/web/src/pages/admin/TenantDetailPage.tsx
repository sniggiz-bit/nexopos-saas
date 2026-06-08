import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, Users, Calendar, CheckCircle2, XCircle,
    Settings2, Info, Loader2, ShieldAlert, BarChart3, Zap,
    Store, CreditCard, Plug, FileText, LogIn, Ban, CheckCheck,
    TrendingUp, Package, Clock, DollarSign, RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface TenantSettings {
    enableBoletaDte: boolean; enableFacturaDte: boolean;
    enableGuiaDespachoDte: boolean; enableNotaCreditoDte: boolean;
    maxBranches: number; maxRegisters: number; maxUsers: number;
    canHardDelete: boolean;
    enableEcommerce: boolean; enableTransbank: boolean; enableIntegrations: boolean;
}

interface TenantDetail {
    id: string; name: string; slug: string; phone?: string; rut?: string;
    giro?: string; address?: string; createdAt: string;
    status: 'ACTIVE' | 'SUSPENDED';
    plan?: { id: string; name: string; price: number };
    settings: TenantSettings | null;
    _count: { users: number; branches: number };
    users: Array<{ id: string; name: string; email: string; role: string }>;
}

interface TenantMetrics {
    salesThisMonth: number; revenueThisMonth: number; productsCount: number;
    usersCount: number; branchesCount: number; lastActivity: string | null;
}

type Tab = 'info' | 'features' | 'saas' | 'metrics' | 'limits' | 'danger';
const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

// ── Primitives ────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange, danger = false }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) => (
    <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${checked ? (danger ? 'bg-red-500' : 'bg-purple-500') : 'bg-neutral-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const ToggleRow = ({ icon: Icon, label, desc, checked, onChange, danger, color = 'text-purple-400' }: {
    icon: React.ElementType; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean; color?: string;
}) => (
    <div className="flex items-center justify-between py-4 border-b border-neutral-700/50 last:border-0">
        <div className="flex items-center gap-3 flex-1 mr-4">
            <div className="p-2 rounded-lg bg-neutral-900/60"><Icon size={16} className={color} /></div>
            <div>
                <p className={`text-sm font-medium ${danger ? 'text-red-300' : 'text-neutral-200'}`}>{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
            </div>
        </div>
        <Toggle checked={checked} onChange={onChange} danger={danger} />
    </div>
);

const NumInput = ({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between py-4 border-b border-neutral-700/50 last:border-0">
        <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-neutral-200">{label}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => onChange(Math.max(1, value - 1))} className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center text-sm font-bold">−</button>
            <span className="w-10 text-center text-sm font-bold text-white tabular-nums">{value}</span>
            <button onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center text-sm font-bold">+</button>
        </div>
    </div>
);

const MetCard = ({ icon: Icon, label, value, sub, color = 'text-purple-400' }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-neutral-800"><Icon size={18} className={color} /></div>
        <div>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="text-base font-bold text-white leading-snug">{value}</p>
            {sub && <p className="text-xs text-neutral-500">{sub}</p>}
        </div>
    </div>
);

const SaveBtn = ({ saving, onClick }: { saving: boolean; onClick: () => void }) => (
    <button onClick={onClick} disabled={saving}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
        {saving ? 'Guardando...' : 'Guardar cambios'}
    </button>
);

// ── Tab: Features ─────────────────────────────────────────────────────────────

function FeaturesTab({ settings, onSave }: { settings: TenantSettings; onSave: (s: Partial<TenantSettings>) => Promise<void> }) {
    const [local, setLocal] = useState(settings);
    const [saving, setSaving] = useState(false);
    const set = (p: Partial<TenantSettings>) => setLocal(prev => ({ ...prev, ...p }));
    const save = async () => { setSaving(true); try { await onSave(local); toast.success('Funciones actualizadas'); } finally { setSaving(false); } };

    return (
        <div className="space-y-5">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-0.5">Módulos principales</p>
                <p className="text-xs text-neutral-500 mb-4">Activa o desactiva funcionalidades para este cliente</p>
                <ToggleRow icon={Store} label="Tienda Online (E-commerce)" desc="Panel admin de tienda, publicación de productos y carrito público" checked={local.enableEcommerce} onChange={v => set({ enableEcommerce: v })} color="text-blue-400" />
                <ToggleRow icon={CreditCard} label="Transbank / Pago electrónico" desc="Integración Webpay para cobros con tarjeta en el punto de venta" checked={local.enableTransbank} onChange={v => set({ enableTransbank: v })} color="text-emerald-400" />
                <ToggleRow icon={Plug} label="Integraciones externas" desc="Shopify, WooCommerce y otras plataformas e-commerce" checked={local.enableIntegrations} onChange={v => set({ enableIntegrations: v })} color="text-amber-400" />
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-0.5">Documentos tributarios electrónicos (DTE)</p>
                <p className="text-xs text-neutral-500 mb-4">Módulos SII Chile — requieren configuración adicional en el cliente</p>
                <ToggleRow icon={FileText} label="Boleta electrónica" desc="Emisión de boletas al SII" checked={local.enableBoletaDte} onChange={v => set({ enableBoletaDte: v })} color="text-purple-400" />
                <ToggleRow icon={FileText} label="Factura electrónica" desc="Emisión de facturas al SII" checked={local.enableFacturaDte} onChange={v => set({ enableFacturaDte: v })} color="text-purple-400" />
                <ToggleRow icon={FileText} label="Guía de despacho" desc="Guías de despacho electrónicas al SII" checked={local.enableGuiaDespachoDte} onChange={v => set({ enableGuiaDespachoDte: v })} color="text-purple-400" />
                <ToggleRow icon={FileText} label="Nota de crédito" desc="Notas de crédito electrónicas al SII" checked={local.enableNotaCreditoDte} onChange={v => set({ enableNotaCreditoDte: v })} color="text-purple-400" />
            </div>
            <SaveBtn saving={saving} onClick={save} />
        </div>
    );
}

// ── Tab: Modules SaaS ─────────────────────────────────────────────────────────

function ModulesSaaSTab({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [catalog, setCatalog] = useState<{id: string, code: string, name: string, description: string}[]>([]);
    const [planModules, setPlanModules] = useState<any[]>([]);
    const [addonModules, setAddonModules] = useState<any[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [catalogRes, tenantRes] = await Promise.all([
                api.get('/modules'),
                api.get(`/modules/tenant/${tenantId}`)
            ]);
            setCatalog(catalogRes.data);
            setPlanModules(tenantRes.data.planModules);
            setAddonModules(tenantRes.data.addonModules);
            setSelectedAddons(new Set(tenantRes.data.addonModules.map((m: any) => m.id)));
        } catch { toast.error('Error cargando módulos SaaS'); }
        finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => { load(); }, [load]);

    const toggleAddon = (id: string) => {
        const next = new Set(selectedAddons);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedAddons(next);
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.post(`/modules/tenant/${tenantId}/addons`, { moduleIds: Array.from(selectedAddons) });
            toast.success('Módulos Add-on guardados exitosamente');
            load();
        } catch { toast.error('Error al guardar addons'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-16 text-neutral-500 gap-2"><Loader2 size={20} className="animate-spin" />Cargando módulos...</div>;

    const planModuleIds = new Set(planModules.map(m => m.id));

    return (
        <div className="space-y-5">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-0.5">Gestión de Módulos SaaS</p>
                <p className="text-xs text-neutral-500 mb-4">Habilita módulos adicionales (Add-ons) independientemente del Plan Base del cliente.</p>
                
                <div className="space-y-1">
                    {catalog.map(mod => {
                        const isIncludedInPlan = planModuleIds.has(mod.id);
                        const isAddonChecked = selectedAddons.has(mod.id);
                        
                        return (
                            <div key={mod.id} className="flex items-center justify-between py-4 border-b border-neutral-700/50 last:border-0">
                                <div className="flex items-center gap-3 flex-1 mr-4">
                                    <div className="p-2 rounded-lg bg-neutral-900/60"><Plug size={16} className="text-blue-400" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-200">
                                            {mod.name} 
                                            {isIncludedInPlan && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Incluido en Plan</span>}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-0.5">{mod.description || 'Sin descripción'} ({mod.code})</p>
                                    </div>
                                </div>
                                {isIncludedInPlan ? (
                                    <div className="px-3 py-1 bg-neutral-700/50 rounded-full text-xs text-neutral-400">Habilitado por Plan</div>
                                ) : (
                                    <Toggle checked={isAddonChecked} onChange={() => toggleAddon(mod.id)} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <SaveBtn saving={saving} onClick={save} />
        </div>
    );
}

// ── Tab: Metrics ──────────────────────────────────────────────────────────────

function MetricsTab({ tenantId }: { tenantId: string }) {
    const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        setLoading(true);
        try { const { data } = await api.get(`/admin/tenants/${tenantId}/metrics`); setMetrics(data); }
        catch { toast.error('Error cargando métricas'); }
        finally { setLoading(false); }
    }, [tenantId]);
    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="flex items-center justify-center py-16 text-neutral-500 gap-2"><Loader2 size={20} className="animate-spin" />Cargando métricas...</div>;
    if (!metrics) return null;

    const lastAct = metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin actividad';

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"><RefreshCw size={13} />Actualizar</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <MetCard icon={TrendingUp} label="Ventas este mes" value={metrics.salesThisMonth} sub="transacciones" color="text-emerald-400" />
                <MetCard icon={DollarSign} label="Ingresos este mes" value={fmt(metrics.revenueThisMonth)} color="text-emerald-400" />
                <MetCard icon={Package} label="Productos activos" value={metrics.productsCount} color="text-blue-400" />
                <MetCard icon={Users} label="Usuarios" value={metrics.usersCount} color="text-purple-400" />
                <MetCard icon={Building2} label="Sucursales" value={metrics.branchesCount} color="text-amber-400" />
                <MetCard icon={Clock} label="Última venta" value={lastAct} color="text-neutral-400" />
            </div>
        </div>
    );
}

// ── Tab: Limits ───────────────────────────────────────────────────────────────

function LimitsTab({ settings, onSave }: { settings: TenantSettings; onSave: (s: Partial<TenantSettings>) => Promise<void> }) {
    const [local, setLocal] = useState(settings);
    const [saving, setSaving] = useState(false);
    const set = (p: Partial<TenantSettings>) => setLocal(prev => ({ ...prev, ...p }));
    const save = async () => { setSaving(true); try { await onSave(local); toast.success('Límites actualizados'); } finally { setSaving(false); } };

    return (
        <div className="space-y-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-4">Límites de recursos</p>
                <NumInput label="Sucursales" desc="Máximo de sucursales permitidas" value={local.maxBranches} onChange={v => set({ maxBranches: v })} />
                <NumInput label="Cajas / Terminales" desc="Terminales de venta por sucursal" value={local.maxRegisters} onChange={v => set({ maxRegisters: v })} />
                <NumInput label="Usuarios" desc="Máximo de usuarios en el equipo" value={local.maxUsers} onChange={v => set({ maxUsers: v })} />
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-1">Permisos especiales</p>
                <p className="text-xs text-neutral-500 mb-4">Capacidades avanzadas potencialmente destructivas</p>
                <ToggleRow icon={ShieldAlert} label="Eliminación permanente" desc="Permite borrar registros de forma irreversible" checked={local.canHardDelete} onChange={v => set({ canHardDelete: v })} danger color="text-red-400" />
            </div>
            <SaveBtn saving={saving} onClick={save} />
        </div>
    );
}

// ── Tab: Danger ───────────────────────────────────────────────────────────────

function DangerTab({ tenant, onStatusChange }: { tenant: TenantDetail; onStatusChange: (s: 'ACTIVE' | 'SUSPENDED') => void }) {
    const [toggling, setToggling] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const adminUser = tenant.users?.find(u => u.role === 'TENANT_ADMIN') ?? tenant.users?.[0];

    const handleToggle = async () => {
        const next = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        if (!window.confirm(next === 'SUSPENDED' ? `¿Suspender a ${tenant.name}? El cliente no podrá acceder.` : `¿Reactivar a ${tenant.name}?`)) return;
        setToggling(true);
        try {
            await api.patch(`/admin/tenants/${tenant.id}/status`, { status: next });
            onStatusChange(next);
            toast.success(next === 'ACTIVE' ? 'Tenant reactivado' : 'Tenant suspendido');
        } catch { toast.error('Error al cambiar estado'); }
        finally { setToggling(false); }
    };

    const handleImpersonate = async () => {
        if (!adminUser?.id) { toast.error('No hay admin disponible'); return; }
        if (!window.confirm(`¿Acceder como ${adminUser.name} (${tenant.name})?`)) return;
        setImpersonating(true);
        try {
            const { data } = await api.post(`/auth/impersonate/${adminUser.id}`);
            if (data.access_token) {
                const prevToken = localStorage.getItem('token');
                const prevUser = localStorage.getItem('user');
                if (prevToken) localStorage.setItem('__prev_session_token', prevToken);
                if (prevUser) localStorage.setItem('__prev_session_user', prevUser);
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('impersonating', tenant.name);
                window.location.href = '/dashboard';
            }
        } catch { toast.error('Error al impersonar'); }
        finally { setImpersonating(false); }
    };

    return (
        <div className="space-y-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10"><LogIn size={16} className="text-blue-400" /></div>
                    <div>
                        <p className="text-sm font-semibold text-white">Acceder como cliente</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Inicia sesión en nombre del cliente para soporte o revisión</p>
                    </div>
                </div>
                {adminUser && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-900/60 rounded-xl mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300 uppercase flex-shrink-0">{adminUser.name.charAt(0)}</div>
                        <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{adminUser.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{adminUser.email}</p>
                        </div>
                    </div>
                )}
                <button onClick={handleImpersonate} disabled={!adminUser?.id || impersonating}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {impersonating ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                    {impersonating ? 'Accediendo...' : 'Acceder como este cliente'}
                </button>
            </div>

            <div className={`border rounded-xl p-5 ${tenant.status === 'ACTIVE' ? 'bg-red-950/20 border-red-900/40' : 'bg-emerald-950/20 border-emerald-900/40'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${tenant.status === 'ACTIVE' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                        {tenant.status === 'ACTIVE' ? <Ban size={16} className="text-red-400" /> : <CheckCircle2 size={16} className="text-emerald-400" />}
                    </div>
                    <div>
                        <p className={`text-sm font-semibold ${tenant.status === 'ACTIVE' ? 'text-red-300' : 'text-emerald-300'}`}>
                            {tenant.status === 'ACTIVE' ? 'Suspender tenant' : 'Reactivar tenant'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {tenant.status === 'ACTIVE' ? 'El cliente perderá acceso inmediatamente. Sus datos se conservan.' : 'El cliente recuperará acceso completo.'}
                        </p>
                    </div>
                </div>
                <button onClick={handleToggle} disabled={toggling}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2
                        ${tenant.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {toggling ? <Loader2 size={15} className="animate-spin" /> : tenant.status === 'ACTIVE' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                    {toggling ? 'Procesando...' : tenant.status === 'ACTIVE' ? 'Suspender tenant' : 'Reactivar tenant'}
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('info');

    useEffect(() => {
        if (!id) return;
        api.get(`/tenants/${id}`)
            .then(r => setTenant(r.data))
            .catch(() => toast.error('Error cargando tenant'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSaveSettings = useCallback(async (patch: Partial<TenantSettings>) => {
        await api.patch(`/tenants/${id}/settings`, patch);
        setTenant(prev => prev ? { ...prev, settings: { ...prev.settings!, ...patch } } : prev);
    }, [id]);

    if (loading) return <div className="flex items-center justify-center h-64 text-neutral-500 gap-2"><Loader2 className="animate-spin" size={20} />Cargando...</div>;
    if (!tenant) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-neutral-500">
            <XCircle size={40} className="text-red-400 opacity-50" />
            <p>Tenant no encontrado</p>
            <button onClick={() => navigate('/admin/tenants')} className="text-purple-400 hover:underline text-sm">← Volver</button>
        </div>
    );

    const settings: TenantSettings = {
        enableBoletaDte: false, enableFacturaDte: false, enableGuiaDespachoDte: false, enableNotaCreditoDte: false,
        maxBranches: 1, maxRegisters: 1, maxUsers: 3, canHardDelete: false,
        enableEcommerce: true, enableTransbank: false, enableIntegrations: false,
        ...(tenant.settings ?? {}),
    };

    const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
        { key: 'info', label: 'Info', Icon: Info },
        { key: 'features', label: 'Funciones (Legacy)', Icon: Zap },
        { key: 'saas', label: 'Módulos SaaS', Icon: Plug },
        { key: 'metrics', label: 'Métricas', Icon: BarChart3 },
        { key: 'limits', label: 'Límites', Icon: Settings2 },
        { key: 'danger', label: 'Acciones', Icon: ShieldAlert },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/tenants')} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white truncate">{tenant.name}</h1>
                    <p className="text-xs text-neutral-500 mt-0.5 font-mono truncate">{tenant.id}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0
                    ${tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {tenant.status === 'ACTIVE' ? <><CheckCircle2 size={12} />Activo</> : <><XCircle size={12} />Suspendido</>}
                </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {([
                    { icon: Users, label: 'Usuarios', value: tenant._count?.users ?? 0, color: 'text-blue-400' },
                    { icon: Building2, label: 'Sucursales', value: tenant._count?.branches ?? 0, color: 'text-purple-400' },
                    { icon: Calendar, label: 'Plan', value: tenant.plan?.name ?? 'Sin plan', color: 'text-amber-400' },
                    { icon: DollarSign, label: 'Precio', value: tenant.plan?.price ? fmt(tenant.plan.price) + '/mes' : '—', color: 'text-emerald-400' },
                ] as const).map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-neutral-800 border border-neutral-700 rounded-xl p-3.5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neutral-900/50"><Icon size={16} className={color} /></div>
                        <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</p>
                            <p className="text-sm font-bold text-white">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-b border-neutral-700">
                <nav className="flex gap-1">
                    {TABS.map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                                ${activeTab === key ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}>
                            <Icon size={15} /><span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'info' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-white mb-3">Datos del negocio</h3>
                            {([['Nombre', tenant.name], ['Slug', tenant.slug], ['RUT', tenant.rut ?? '—'], ['Giro', tenant.giro ?? '—'], ['Teléfono', tenant.phone ?? '—'], ['Dirección', tenant.address ?? '—']] as [string, string][]).map(([l, v]) => (
                                <div key={l} className="flex justify-between items-start">
                                    <span className="text-xs text-neutral-500">{l}</span>
                                    <span className="text-sm text-neutral-200 text-right max-w-[60%] break-words">{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-3">Usuarios</h3>
                            <div className="space-y-2">
                                {tenant.users?.length ? tenant.users.map(u => (
                                    <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900/50">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300 uppercase flex-shrink-0">{u.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-200 truncate">{u.name}</p>
                                            <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400 flex-shrink-0">{u.role}</span>
                                    </div>
                                )) : <p className="text-sm text-neutral-500">Sin usuarios.</p>}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'features' && <FeaturesTab settings={settings} onSave={handleSaveSettings} />}
                {activeTab === 'saas' && id && <ModulesSaaSTab tenantId={id} />}
                {activeTab === 'metrics' && id && <MetricsTab tenantId={id} />}
                {activeTab === 'limits' && <LimitsTab settings={settings} onSave={handleSaveSettings} />}
                {activeTab === 'danger' && <DangerTab tenant={tenant} onStatusChange={s => setTenant(prev => prev ? { ...prev, status: s } : prev)} />}
            </div>
        </div>
    );
}
