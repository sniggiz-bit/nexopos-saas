import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Zap,
  CheckCircle2,
  Crown,
  Store,
  Plug,
  FileText,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  Save,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Upload,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { formatCurrency, formatDate } from '../../utils/format';

interface ModuleDef {
  id: string;
  code: string;
  name: string;
  description: string;
  price?: number;
}

interface TenantModulesResponse {
  tenant: {
    id: string;
    name: string;
    rut: string;
    status: string;
  };
  planModules: ModuleDef[];
  addonModules: ModuleDef[];
  allActive: ModuleDef[];
}

export function SubscriptionPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [activeTab, setActiveTab] = useState<'modules' | 'subscription'>('modules');

  // Module store state
  const [allModules, setAllModules] = useState<ModuleDef[]>([]);
  const [activeModules, setActiveModules] = useState<TenantModulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState<string | null>(null);

  // Subscription & Billing details state
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [publicPlans, setPublicPlans] = useState<any[]>([]);
  const [savingBilling, setSavingBilling] = useState(false);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Billing profile form state
  const [billingForm, setBillingForm] = useState({
    name: '',
    rut: '',
    giro: '',
    address: '',
    phone: '',
    logoUrl: '',
  });

  const handleBusinessLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingLogo(true);
    try {
      const { data } = await api.post('/uploads/logo', formData);
      setBillingForm(prev => ({ ...prev, logoUrl: data.url }));
      toast.success('Logo del negocio subido correctamente');
    } catch {
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Group definitions matching the admin panel
  const coreCodes = ['POS', 'QUOTES', 'CUSTOMERS', 'EXTRA_BRANCH', 'CREDITS'];
  const integrationsCodes = ['ECOMMERCE', 'SHOPIFY', 'WOOCOMMERCE', 'TRANSBANK'];
  const dteCodes = ['DTE_BOLETA', 'DTE_FACTURA', 'DTE_NOTA_CREDITO', 'DTE_GUIA_DESPACHO'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesRes, activeRes, tenantRes, invoicesRes, plansRes] = await Promise.all([
        api.get('/modules'),
        api.get('/modules/me'),
        tenantId ? api.get(`/tenants/${tenantId}`) : Promise.resolve({ data: null }),
        api.get('/billing/invoices'),
        api.get('/plans/public')
      ]);
      setAllModules(modulesRes.data);
      setActiveModules(activeRes.data);

      if (tenantRes.data) {
        setTenantInfo(tenantRes.data);
        setBillingForm({
          name: tenantRes.data.name || '',
          rut: tenantRes.data.rut || '',
          giro: tenantRes.data.giro || '',
          address: tenantRes.data.address || '',
          phone: tenantRes.data.phone || '',
          logoUrl: tenantRes.data.logoUrl || '',
        });
      }
      setInvoices(invoicesRes.data || []);
      setPublicPlans(plansRes.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cargar la información de suscripción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHireModule = async (module: ModuleDef) => {
    if (!window.confirm(`¿Estás seguro de contratar el módulo "${module.name}" por $${module.price?.toLocaleString('es-CL') || '10.000'} al mes? Serás redirigido a Mercado Pago.`)) {
      return;
    }

    try {
      setHiring(module.id);
      
      const response = await api.post('/mercadopago/subscribe-module', { moduleId: module.id });
      
      if (response.data && response.data.init_point) {
        window.location.href = response.data.init_point;
      } else {
        toast.error('No se pudo generar el link de pago');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al conectar con Mercado Pago');
    } finally {
      setHiring(null);
    }
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      setSavingBilling(true);
      const response = await api.patch(`/tenants/${tenantId}/billing`, billingForm);
      setTenantInfo((prev: any) => ({ ...prev, ...response.data }));
      toast.success('Datos de facturación actualizados correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar los datos de facturación');
    } finally {
      setSavingBilling(false);
    }
  };

  const handleChangePlan = async (planId: string | null, planName: string) => {
    if (!tenantId) return;
    if (!window.confirm(`¿Estás seguro de cambiar al plan "${planName}"? Esta operación simulará la facturación y el cambio de límites.`)) {
      return;
    }

    try {
      setChangingPlan(planId);
      const response = await api.post(`/tenants/${tenantId}/change-plan-simulate`, { planId });
      setTenantInfo(response.data);
      toast.success(`Plan cambiado a "${planName}" con éxito`);
      
      // Refresh related data
      const [invoicesRes, activeRes] = await Promise.all([
        api.get('/billing/invoices'),
        api.get('/modules/me')
      ]);
      setInvoices(invoicesRes.data || []);
      setActiveModules(activeRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar de plan');
    } finally {
      setChangingPlan(null);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setPayingInvoice(invoiceId);
      await api.post(`/billing/invoices/${invoiceId}/pay-simulate`);
      toast.success('Pago simulado procesado con éxito');
      
      // Reload invoices & tenant state
      const [invoicesRes, tenantRes] = await Promise.all([
        api.get('/billing/invoices'),
        api.get(`/tenants/${tenantId}`)
      ]);
      setInvoices(invoicesRes.data || []);
      if (tenantRes.data) {
        setTenantInfo(tenantRes.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setPayingInvoice(null);
    }
  };

  const handlePayServiceInvoices = async () => {
    try {
      setPayingInvoice('all');
      const response = await api.post('/mercadopago/pay-invoices');
      if (response.data && response.data.init_point) {
        window.location.href = response.data.init_point;
      } else {
        toast.error('No se pudo generar el link de pago para las facturas');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Aún no está implementado el endpoint de pago masivo en el backend');
    } finally {
      setPayingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 dark:text-indigo-400 relative z-10" />
        </div>
        <p className="mt-4 text-muted-foreground font-medium tracking-wide animate-pulse">
          Cargando ecosistema de módulos...
        </p>
      </div>
    );
  }

  const activeIds = activeModules?.allActive.map(m => m.id) || [];

  const renderModuleGrid = (codes: string[], Icon: any, gradient: string, glow: string) => {
    const modules = allModules.filter(m => codes.includes(m.code));
    if (modules.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6 relative z-10">
        {modules.map(mod => {
          const isActive = activeIds.includes(mod.id);
          const isIncludedInPlan = activeModules?.planModules.some(pm => pm.id === mod.id);
          const isHiring = hiring === mod.id;

          return (
            <div
              key={mod.id}
              className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-500 ${
                isActive
                  ? `bg-emerald-50 dark:bg-white/[0.04] border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-emerald-100 dark:hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]`
                  : `bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.04] shadow-sm hover:shadow-slate-100`
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent rounded-2xl pointer-events-none" />
              )}
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg ${glow}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {isActive && (
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border border-emerald-300 dark:border-emerald-400/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activo
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                {mod.name}
              </h3>
              {!isIncludedInPlan && (
                <div className="mb-3">
                  <span className="text-2xl font-black text-foreground">
                    ${mod.price?.toLocaleString('es-CL') || '10.000'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">/mes</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {mod.description || 'Integra capacidades avanzadas a tu plataforma y automatiza tu operación.'}
              </p>

              <div className="mt-auto pt-5 border-t border-slate-100 dark:border-white/[0.05] relative z-10">
                {isActive ? (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400/80">
                      <ShieldCheck className="w-4 h-4" />
                      {isIncludedInPlan ? 'Plan Base (Incluido)' : 'Add-on Extra'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleHireModule(mod)}
                    disabled={isHiring}
                    className="w-full relative overflow-hidden group/btn flex items-center justify-between px-5 py-3 rounded-xl bg-slate-100 hover:bg-indigo-600 dark:bg-white/[0.05] dark:hover:bg-indigo-600 border border-slate-200 hover:border-indigo-500 dark:border-white/[0.1] dark:hover:border-indigo-500 text-slate-700 hover:text-white dark:text-white text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 disabled:hover:border-slate-200 dark:disabled:hover:bg-white/[0.05] dark:disabled:hover:border-white/[0.1]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/20 to-indigo-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    {isHiring ? (
                      <span className="flex items-center gap-2 mx-auto">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500 dark:text-indigo-300" /> Instalando...
                      </span>
                    ) : (
                      <>
                        <span>Contratar Módulo</span>
                        <ArrowRight className="w-4 h-4 opacity-70 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-7xl mx-auto pb-20">
        
        {/* ── Resumen de Suscripción (Hero) ── */}
        <div className="relative overflow-hidden rounded-3xl border p-8 md:p-10 shadow-xl
          bg-gradient-to-br from-slate-900 to-slate-800
          dark:bg-none dark:bg-slate-950/50
          border-slate-700 dark:border-white/[0.05]">

          {/* Decorative blobs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start md:items-center justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-slate-200">
                  {tenantInfo?.name || activeModules?.tenant?.name || 'Cargando negocio...'} {tenantInfo?.rut && `(${tenantInfo.rut})`}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                Control total sobre tu <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Ecosistema</span>
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Personaliza las capacidades de tu plataforma. Paga únicamente por lo que usas e instala nuevas herramientas con un solo clic, sin descargas ni configuraciones complejas.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none bg-white/10 border border-white/15 rounded-2xl p-6 min-w-[180px] shadow-inner backdrop-blur-xl">
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-emerald-400" />
                  Módulos en Plan
                </p>
                <p className="text-4xl font-black text-white">{activeModules?.planModules.length || 0}</p>
              </div>
              <div className="flex-1 md:flex-none bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-2xl p-6 min-w-[180px] shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] backdrop-blur-xl">
                <p className="text-[11px] text-indigo-200 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Add-ons Extra
                </p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{activeModules?.addonModules.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-slate-200 dark:border-white/[0.05] mb-8">
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-px
                ${activeTab === 'modules'
                  ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              <Store size={16} />
              Módulos y Add-ons
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-px
                ${activeTab === 'subscription'
                  ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              <Crown size={16} />
              Mi Suscripción
            </button>
          </nav>
        </div>

        {/* Tab: App Store / Modules */}
        {activeTab === 'modules' && (
          <div className="space-y-16">
            {/* Core Modules */}
            <section className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                  <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">Operación Base y Ventas</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-11 mb-2">Expande la gestión comercial y operativa del Punto de Venta.</p>
              {renderModuleGrid(coreCodes, Store, "from-blue-500 to-cyan-500", "shadow-blue-500/30")}
            </section>

            {/* Integraciones */}
            <section className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <Plug className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">E-commerce e Integraciones</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-11 mb-2">Conecta tu tienda física con Shopify, WooCommerce y Transbank.</p>
              {renderModuleGrid(integrationsCodes, Plug, "from-amber-500 to-orange-500", "shadow-amber-500/30")}
            </section>

            {/* DTE */}
            <section className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">Documentos Tributarios (SII)</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-11 mb-2">Emisión automática de Boletas, Facturas y Notas de Crédito.</p>
              {renderModuleGrid(dteCodes, FileText, "from-purple-500 to-pink-500", "shadow-purple-500/30")}
            </section>
          </div>
        )}

        {/* Tab: Subscription Details */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
            
            {/* Left Column (Plan & Billing Profile) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Card Plan Activo */}
              <div className="relative overflow-hidden rounded-2xl border p-6 shadow-lg bg-white/[0.02] border-slate-200 dark:border-white/[0.05] backdrop-blur-md">
                <div className="absolute top-0 right-0 p-4">
                  <Crown className="w-8 h-8 text-indigo-500/20" />
                </div>
                
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Plan Contratado</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-foreground">
                    {tenantInfo?.plan?.name || 'Sin Plan'}
                  </span>
                  {tenantInfo?.plan?.price !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({formatCurrency(tenantInfo.plan.price)}/mes)
                    </span>
                  )}
                </div>

                {/* Billing Status Badge */}
                <div className="mb-6">
                  {tenantInfo?.billingStatus === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Suscripción Activa
                    </span>
                  )}
                  {tenantInfo?.billingStatus === 'PAST_DUE' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pago Atrasado
                    </span>
                  )}
                  {tenantInfo?.billingStatus === 'CANCELED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Cancelada
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4 space-y-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo Cobro:</span>
                    <span className="font-semibold text-foreground">
                      {tenantInfo?.nextPayment ? formatDate(tenantInfo.nextPayment) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Límite Usuarios:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {tenantInfo?.users?.length ?? 0} / {tenantInfo?.settings?.maxUsers ?? '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Límite Sucursales:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {tenantInfo?.branches?.length ?? 0} / {tenantInfo?.settings?.maxBranches ?? '∞'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario Perfil de Facturación */}
              <div className="rounded-2xl border p-6 shadow-lg bg-white/[0.02] border-slate-200 dark:border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-foreground">Perfil de Facturación</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Registra los datos legales para la facturación mensual del servicio de NexoPOS.
                </p>

                <form onSubmit={handleSaveBilling} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Razón Social / Nombre Legal</label>
                    <input
                      type="text"
                      required
                      value={billingForm.name}
                      onChange={e => setBillingForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-white/[0.08] bg-card/[0.5] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ej. Comercializadora Limitada"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">RUT</label>
                      <input
                        type="text"
                        required
                        value={billingForm.rut}
                        onChange={e => setBillingForm(prev => ({ ...prev, rut: e.target.value }))}
                        className="w-full border border-slate-200 dark:border-white/[0.08] bg-card/[0.5] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Ej. 76.123.456-7"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Teléfono</label>
                      <input
                        type="text"
                        value={billingForm.phone}
                        onChange={e => setBillingForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-slate-200 dark:border-white/[0.08] bg-card/[0.5] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Ej. +56912345678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Giro Comercial</label>
                    <input
                      type="text"
                      value={billingForm.giro}
                      onChange={e => setBillingForm(prev => ({ ...prev, giro: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-white/[0.08] bg-card/[0.5] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ej. Venta al por menor de abarrotes"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Dirección Comercial</label>
                    <input
                      type="text"
                      value={billingForm.address}
                      onChange={e => setBillingForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-white/[0.08] bg-card/[0.5] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ej. Av. Providencia 1234, Oficina 501"
                    />
                  </div>

                  {/* Logo del negocio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">
                      Logo de la Empresa (se muestra en cotizaciones)
                    </label>
                    {billingForm.logoUrl ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-card/[0.5]">
                        <img src={billingForm.logoUrl} alt="Logo Empresa" className="h-12 w-auto object-contain rounded-lg"
                          onError={e => (e.currentTarget.style.display = 'none')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate text-muted-foreground">{billingForm.logoUrl}</p>
                        </div>
                        <button type="button" onClick={() => setBillingForm(prev => ({ ...prev, logoUrl: '' }))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm border-2 border-dashed border-slate-200 dark:border-white/[0.08] text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all disabled:opacity-50">
                        {uploadingLogo ? (
                          <><Loader2 className="w-4 h-4 animate-spin text-indigo-500" />Subiendo...</>
                        ) : (
                          <><Upload className="w-4 h-4 text-indigo-400" />Subir logo <span className="text-xs text-muted-foreground">(JPG, PNG — máx 5MB)</span></>
                        )}
                      </button>
                    )}
                    <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                      className="hidden" onChange={handleBusinessLogoUpload} />
                  </div>

                  <button
                    type="submit"
                    disabled={savingBilling}
                    className="w-full relative overflow-hidden flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    {savingBilling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Guardar Perfil
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (Plans List & Invoices Table) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Comparador de Planes */}
              <div className="rounded-2xl border p-6 shadow-lg bg-white/[0.02] border-slate-200 dark:border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-foreground">Planes de Suscripción</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Cambia de plan en cualquier momento. El cambio recalcula los límites del sistema al instante de forma simulada.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {publicPlans.map(plan => {
                    const isCurrent = tenantInfo?.planId === plan.id;
                    const isChanging = changingPlan === plan.id;
                    const features = Array.isArray(plan.features) ? plan.features : [];

                    return (
                      <div
                        key={plan.id}
                        className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                          isCurrent
                            ? 'bg-indigo-500/[0.02] border-indigo-500/40 shadow-[0_0_20px_-5px_rgba(99,102,241,0.1)]'
                            : 'bg-card/[0.3] border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.1]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-foreground text-base">{plan.name}</h4>
                          {plan.isRecommended && (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed min-h-[32px]">
                          {plan.description || 'Sin descripción.'}
                        </p>
                        <div className="mb-5">
                          <span className="text-2xl font-black text-foreground">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">/mes</span>
                        </div>

                        {/* Bullet list of benefits */}
                        <ul className="space-y-2 mb-6 flex-1">
                          <li className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>Máx. Usuarios: {plan.maxUsers}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>Máx. Productos: {plan.maxProducts}</span>
                          </li>
                          {features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleChangePlan(plan.id, plan.name)}
                          disabled={isCurrent || changingPlan !== null}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            isCurrent
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default font-bold'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/10'
                          }`}
                        >
                          {isChanging ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto text-white" />
                          ) : isCurrent ? (
                            'Plan Activo'
                          ) : (
                            'Activar Plan'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historial de Cobros (Invoices) */}
              <div className="rounded-2xl border p-6 shadow-lg bg-white/[0.02] border-slate-200 dark:border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-foreground">Facturas de Servicio</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoices.some(inv => inv.status === 'PENDING') && (
                      <button
                        onClick={handlePayServiceInvoices}
                        disabled={payingInvoice === 'all'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all"
                      >
                        {payingInvoice === 'all' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        Pagar Facturas Pendientes
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const res = await api.get('/billing/invoices');
                        setInvoices(res.data || []);
                        toast.success('Historial actualizado');
                      }}
                      className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.05] hover:bg-card text-slate-400 hover:text-white transition-colors"
                      title="Actualizar Historial"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Consulta el estado de tus facturas de cobro recurrentes generadas para tu cuenta.
                </p>

                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-card/[0.2] border border-dashed border-slate-200 dark:border-white/[0.05] rounded-xl">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-25" />
                    <p className="text-sm font-semibold">Sin facturas emitidas</p>
                    <p className="text-xs">Las facturas de cobro mensuales se generarán en la fecha de tu próximo pago.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/[0.05] text-xs font-bold text-slate-400 uppercase">
                          <th className="pb-3 pr-2">ID Factura</th>
                          <th className="pb-3 px-2">Vencimiento</th>
                          <th className="pb-3 px-2">Monto</th>
                          <th className="pb-3 px-2">Estado</th>
                          <th className="pb-3 pl-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                        {invoices.map(invoice => {
                          const isPaying = payingInvoice === invoice.id;
                          return (
                            <tr key={invoice.id} className="hover:bg-white/[0.01]">
                              <td className="py-3 pr-2 font-mono text-xs truncate max-w-[120px] text-slate-300" title={invoice.id}>
                                {invoice.id}
                              </td>
                              <td className="py-3 px-2 text-slate-400 text-xs">
                                {formatDate(invoice.dueDate)}
                              </td>
                              <td className="py-3 px-2 font-bold text-foreground">
                                {formatCurrency(invoice.amount)}
                              </td>
                              <td className="py-3 px-2">
                                {invoice.status === 'PAID' && (
                                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Pagado
                                  </span>
                                )}
                                {invoice.status === 'PENDING' && (
                                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Pendiente
                                  </span>
                                )}
                                {invoice.status === 'FAILED' && (
                                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                    Fallido
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pl-2 text-right">
                                {invoice.status !== 'PAID' ? (
                                  <button
                                    onClick={() => handlePayInvoice(invoice.id)}
                                    disabled={payingInvoice !== null}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                  >
                                    {isPaying ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-white" />
                                    ) : (
                                      'Simular Pago'
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-500 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

