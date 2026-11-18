import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, CreditCard, FileText, Loader2, RefreshCw, Settings2, ShieldAlert, Store, Users, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import WelcomeEmailPanel from './WelcomeEmailPanel';
import TenantUsersPanel from './TenantUsersPanel';
import TenantBranchesPanel from './TenantBranchesPanel';
import TenantServicesPanel from './TenantServicesPanel';
import TenantActionsPanel from './TenantActionsPanel';
import TenantDteRecordsPanel from './TenantDteRecordsPanel';
import { ClientRecord, cardClass, errorMessage, fieldClass, money, primaryClass, secondaryClass } from './client-record';

const tabs = [
  { id: 'overview', name: 'Ficha general', icon: Building2 },
  { id: 'users', name: 'Usuarios', icon: Users },
  { id: 'branches', name: 'Sucursales', icon: Store },
  { id: 'services', name: 'Servicios y módulos', icon: Zap },
  { id: 'subscription', name: 'Suscripción y límites', icon: CreditCard },
  { id: 'dte', name: 'Registros tributarios', icon: FileText },
  { id: 'activity', name: 'Actividad', icon: FileText },
  { id: 'actions', name: 'Acciones', icon: ShieldAlert },
];
export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') || 'overview';
  const tab = tabs.some(t => t.id === requested) ? requested : 'overview';
  const [tenant, setTenant] = useState<ClientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setError('');
    try {
      const { data } = await api.get('/admin/tenants/' + id, { signal });
      if (!signal?.aborted) setTenant(data);
    } catch (err) { if (!signal?.aborted) setError(errorMessage(err, 'No se pudo cargar la ficha del cliente.')); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setTenant(null);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const refresh = useCallback(async () => { await load(); }, [load]);
  if (loading) return <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground"><Loader2 className="animate-spin" size={20} />Cargando ficha...</div>;
  if (error || !tenant) return <div className={cardClass}><h1 className="text-lg font-semibold">Ficha de cliente</h1><p role="alert" className="my-4 text-red-400">{error || 'Cliente no encontrado.'}</p><div className="flex gap-2"><button className={secondaryClass} onClick={() => navigate('/admin/tenants')}>Volver a clientes</button><button className={primaryClass} onClick={refresh}>Reintentar</button></div></div>;
  const activeUsers = tenant.users.filter(u => u.isActive).length;
  const activeBranches = tenant.branches.filter(b => b.isActive).length;
  const cards = [
    { label: 'Usuarios habilitados', value: activeUsers, detail: 'de ' + tenant.users.length + ' registrados', icon: Users },
    { label: 'Sucursales habilitadas', value: activeBranches, detail: 'de ' + tenant.branches.length + ' registradas', icon: Store },
    { label: 'Plan de servicios', value: tenant.plan?.name || 'Acceso básico', detail: tenant.plan ? money(tenant.plan.price) + ' / mes' : 'Sin plan asignado', icon: CreditCard },
    { label: 'Productos', value: tenant._count.products, detail: tenant._count.sales + ' ventas registradas', icon: FileText },
  ];
  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3"><button className={secondaryClass + ' shrink-0'} aria-label="Volver a clientes" onClick={() => navigate('/admin/tenants')}><ArrowLeft size={18} /></button><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-cyan-500">Gestión de clientes</p><h1 className="mt-1 text-2xl font-bold break-words">{tenant.name}</h1><p className="mt-1 text-sm text-muted-foreground">{tenant.rut || 'Sin RUT registrado'} · Registro: {new Date(tenant.createdAt).toLocaleDateString('es-CL')}</p></div></div>
      <div className="flex items-center gap-3"><span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ' + (tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400')}><CheckCircle2 size={13} />{tenant.status === 'ACTIVE' ? 'Empresa activa' : 'Empresa suspendida'}</span><button className={secondaryClass} aria-label="Actualizar ficha" onClick={refresh}><RefreshCw size={15} /></button></div>
    </header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <div key={card.label} className={cardClass + ' flex items-center gap-3'}><div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500"><card.icon size={20} /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{card.label}</p><p className="mt-1 text-xl font-semibold break-words">{card.value}</p><p className="mt-1 text-xs text-muted-foreground">{card.detail}</p></div></div>)}</div>
    <nav aria-label="Secciones de la ficha" role="tablist" className="flex gap-1 overflow-x-auto border-b border-border pb-1">{tabs.map(item => <button key={item.id} id={'tab-' + item.id} aria-controls={'panel-' + item.id} role="tab" aria-selected={tab === item.id} onClick={() => setParams({ tab: item.id })} className={'inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors ' + (tab === item.id ? 'border-cyan-500 bg-cyan-500/5 text-cyan-500' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground')}><item.icon size={16} />{item.name}</button>)}</nav>
    <section key={tenant.id + ':' + tab} id={'panel-' + tab} role="tabpanel" aria-labelledby={'tab-' + tab} className="min-w-0">
      {tab === 'overview' && <div className="grid gap-5 lg:grid-cols-2"><ClientProfile key={tenant.updatedAt} tenant={tenant} onChanged={refresh} /><div className="space-y-5"><div className={cardClass}><h2 className="text-lg font-semibold">Control del cliente</h2><p className="mt-2 text-sm text-muted-foreground">Gestiona sus servicios y accesos desde esta ficha. Los usuarios del negocio consultan sus sucursales; la habilitación queda bajo tu control.</p><div className="mt-4 flex flex-wrap gap-2"><button className={secondaryClass} onClick={() => setParams({ tab: 'users' })}><Users size={15} />Gestionar usuarios</button><button className={secondaryClass} onClick={() => setParams({ tab: 'branches' })}><Store size={15} />Gestionar sucursales</button><button className={secondaryClass} onClick={() => setParams({ tab: 'services' })}><Zap size={15} />Gestionar servicios</button></div></div><WelcomeEmailPanel tenantId={tenant.id} active={tenant.status === 'ACTIVE'} /></div></div>}
      {tab === 'users' && <TenantUsersPanel tenant={tenant} onChanged={refresh} />}
      {tab === 'branches' && <TenantBranchesPanel tenant={tenant} onChanged={refresh} />}
      {tab === 'services' && <TenantServicesPanel tenantId={tenant.id} />}
      {tab === 'subscription' && <SubscriptionPanel key={tenant.updatedAt + ':' + tenant.plan?.id} tenant={tenant} onChanged={refresh} />}
      {tab === 'dte' && <TenantDteRecordsPanel tenantId={tenant.id} />}
      {tab === 'activity' && <ActivityPanel tenantId={tenant.id} />}
      {tab === 'actions' && <TenantActionsPanel tenant={tenant} onChanged={refresh} onDeleted={() => navigate('/admin/tenants', { replace: true })} />}
    </section>
  </div>;
}
function ClientProfile({ tenant, onChanged }: { tenant: ClientRecord; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({ name: tenant.name, rut: tenant.rut || '', giro: tenant.giro || '', phone: tenant.phone || '', address: tenant.address || '' });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/admin/tenants/' + tenant.id, form); await onChanged(); toast.success('Datos del cliente actualizados.'); }
    catch (error) { toast.error(errorMessage(error, 'No se pudieron guardar los datos.')); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className={cardClass + ' space-y-4'}><h2 className="text-lg font-semibold">Datos de la empresa</h2>{([{ key: 'name', label: 'Nombre de la empresa', max: 150 }, { key: 'rut', label: 'RUT', max: 30 }, { key: 'giro', label: 'Giro comercial', max: 150 }, { key: 'phone', label: 'Teléfono', max: 30 }, { key: 'address', label: 'Dirección', max: 300 }] as const).map(field => <label key={field.key} className="block text-sm">{field.label}<input className={fieldClass + ' mt-1'} required={field.key === 'name'} maxLength={field.max} disabled={saving} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} /></label>)}<button className={primaryClass} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}Guardar datos</button></form>;
}
function SubscriptionPanel({ tenant, onChanged }: { tenant: ClientRecord; onChanged: () => Promise<void> }) {
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [planId, setPlanId] = useState(tenant.plan?.id || '');
  const [settings, setSettings] = useState({ maxUsers: tenant.settings?.maxUsers ?? 3, maxBranches: tenant.settings?.maxBranches ?? 1, maxRegisters: tenant.settings?.maxRegisters ?? 1 });
  const [billing, setBilling] = useState({ billingStatus: tenant.billingStatus, nextPayment: tenant.nextPayment ? tenant.nextPayment.slice(0, 10) : '' });
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => { api.get('/plans').then(res => setPlans(res.data)).catch(() => toast.error('No se pudo cargar el catálogo de planes.')); }, []);
  const save = async (kind: 'plan' | 'limits' | 'billing') => {
    setSaving(kind);
    try {
      if (kind === 'plan') await api.patch('/admin/tenants/' + tenant.id + '/plan', { planId: planId || null });
      if (kind === 'limits') await api.patch('/admin/tenants/' + tenant.id + '/settings', settings);
      if (kind === 'billing') await api.patch('/admin/tenants/' + tenant.id, { billingStatus: billing.billingStatus, nextPayment: billing.nextPayment ? new Date(billing.nextPayment + 'T12:00:00').toISOString() : null });
      await onChanged(); toast.success('Configuración actualizada.');
    } catch (error) { toast.error(errorMessage(error, 'No se pudo guardar la configuración.')); }
    finally { setSaving(null); }
  };
  return <div className="grid gap-5 lg:grid-cols-2">
    <div className={cardClass + ' space-y-4'}><h2 className="flex items-center gap-2 font-semibold text-lg"><CreditCard size={20} className="text-cyan-500" />Plan de servicios</h2><p className="text-sm text-muted-foreground">Asigna el plan base. Las decisiones manuales de Servicios y módulos se conservan.</p><select className={fieldClass} value={planId} disabled={!!saving} onChange={e => setPlanId(e.target.value)}><option value="">Sin plan · acceso básico</option>{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price)} / mes</option>)}</select><button className={primaryClass} disabled={!!saving || planId === (tenant.plan?.id || '')} onClick={() => save('plan')}>{saving === 'plan' && <Loader2 className="animate-spin" size={16} />}Guardar plan</button></div>
    <div className={cardClass + ' space-y-4'}><h2 className="flex items-center gap-2 font-semibold text-lg"><Settings2 size={20} className="text-cyan-500" />Límites de recursos</h2><p className="text-sm text-muted-foreground">Aplican a nuevas altas y habilitaciones. Reducirlos no desactiva recursos existentes.</p>{([{ key: 'maxUsers', label: 'Usuarios habilitados' }, { key: 'maxBranches', label: 'Sucursales habilitadas' }] as const).map(item => <label className="flex items-center justify-between gap-4 text-sm" key={item.key}>{item.label}<input className={fieldClass + ' !w-24'} type="number" min={1} max={100000} step={1} required disabled={!!saving} value={settings[item.key]} onChange={e => setSettings({ ...settings, [item.key]: Number(e.target.value) })} /></label>)}<button className={primaryClass} disabled={!!saving || Object.values(settings).some(v => !Number.isInteger(v) || v < 1)} onClick={() => save('limits')}>{saving === 'limits' && <Loader2 className="animate-spin" size={16} />}Guardar límites</button></div>
    <div className={cardClass + ' space-y-4'}><h2 className="font-semibold text-lg">Estado de suscripción</h2><p className="text-xs text-muted-foreground">Este estado regula el acceso a NexoPOS. Gestiona los cobros contratados también con tu proveedor de pago.</p><label className="block text-sm">Estado<select className={fieldClass + ' mt-1'} disabled={!!saving} value={billing.billingStatus} onChange={e => setBilling({ ...billing, billingStatus: e.target.value as ClientRecord['billingStatus'] })}><option value="ACTIVE">Al día</option><option value="PAST_DUE">Pago pendiente</option><option value="CANCELED">Cancelada</option></select></label><label className="block text-sm">Próximo vencimiento<input className={fieldClass + ' mt-1'} type="date" value={billing.nextPayment} disabled={!!saving} onChange={e => setBilling({ ...billing, nextPayment: e.target.value })} /></label><button className={primaryClass} disabled={!!saving} onClick={() => save('billing')}>{saving === 'billing' && <Loader2 size={16} className="animate-spin" />}Guardar estado</button></div>
    <div className={cardClass}><h2 className="font-semibold text-lg mb-3">Últimas facturas de servicios</h2>{tenant.invoices.length ? <div className="divide-y divide-border">{tenant.invoices.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><strong>{money(invoice.amount)}</strong><p className="text-xs text-muted-foreground mt-1">Vence: {new Date(invoice.dueDate).toLocaleDateString('es-CL')}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{({ PAID: 'Pagada', PENDING: 'Pendiente', FAILED: 'Fallida' } as Record<string, string>)[invoice.status] || invoice.status}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Sin facturas de servicios registradas.</p>}</div>
  </div>;
}
function ActivityPanel({ tenantId }: { tenantId: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/admin/tenants/' + tenantId + '/metrics', { signal: controller.signal }).then(res => setMetrics(res.data)).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [tenantId]);
  if (failed) return <p role="alert" className="text-red-400">No se pudo cargar la actividad.</p>;
  if (!metrics) return <p className="flex items-center gap-2 text-muted-foreground"><Loader2 size={18} className="animate-spin" />Cargando actividad...</p>;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
    ['Ventas este mes', metrics.salesThisMonth], ['Ingresos este mes', money(metrics.revenueThisMonth)],
    ['Productos activos', metrics.productsCount], ['Usuarios registrados', metrics.usersCount], ['Sucursales registradas', metrics.branchesCount],
    ['Última venta', metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleString('es-CL') : 'Sin ventas'],
  ].map(([label, value]) => <div key={label} className={cardClass}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>;
}
