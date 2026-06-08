import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Award, Zap, CheckCircle2, Crown, Store, Plug, FileText, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';

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
  const [allModules, setAllModules] = useState<ModuleDef[]>([]);
  const [activeModules, setActiveModules] = useState<TenantModulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState<string | null>(null);

  // Group definitions matching the admin panel
  const coreCodes = ['POS', 'QUOTES', 'CUSTOMERS', 'EXTRA_BRANCH', 'CREDITS'];
  const integrationsCodes = ['ECOMMERCE', 'SHOPIFY', 'WOOCOMMERCE', 'TRANSBANK'];
  const dteCodes = ['DTE_BOLETA', 'DTE_FACTURA', 'DTE_NOTA_CREDITO', 'DTE_GUIA_DESPACHO'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesRes, activeRes] = await Promise.all([
        api.get('/modules'),
        api.get('/modules/me')
      ]);
      setAllModules(modulesRes.data);
      setActiveModules(activeRes.data);
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
        // Redirect to Mercado Pago
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 relative z-10" />
        </div>
        <p className="mt-4 text-indigo-200/60 font-medium tracking-wide animate-pulse">Cargando ecosistema de módulos...</p>
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
                  ? `bg-white/[0.04] border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]` 
                  : `bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]`
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
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activo
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-indigo-200 transition-colors">
                {mod.name}
              </h3>
              {!isIncludedInPlan && (
                <div className="mb-3">
                  <span className="text-2xl font-black text-white">
                    ${mod.price?.toLocaleString('es-CL') || '10.000'}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/mes</span>
                </div>
              )}
              <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-1">
                {mod.description || 'Integra capacidades avanzadas a tu plataforma y automatiza tu operación.'}
              </p>

              <div className="mt-auto pt-5 border-t border-white/[0.05] relative z-10">
                {isActive ? (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-2 text-emerald-400/80">
                      <ShieldCheck className="w-4 h-4" />
                      {isIncludedInPlan ? 'Plan Base (Incluido)' : 'Add-on Extra'}
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleHireModule(mod)}
                    disabled={isHiring}
                    className="w-full relative overflow-hidden group/btn flex items-center justify-between px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-indigo-600 border border-white/[0.1] hover:border-indigo-500 text-white text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:hover:bg-white/[0.05] disabled:hover:border-white/[0.1]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/20 to-indigo-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    {isHiring ? (
                      <span className="flex items-center gap-2 mx-auto">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-300" /> Instalando...
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
      <div className="relative overflow-hidden rounded-3xl bg-slate-950/50 border border-white/[0.05] p-8 md:p-10 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start md:items-center justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-300">
                {activeModules?.tenant?.name || 'Cargando negocio...'} {activeModules?.tenant?.rut && `(${activeModules.tenant.rut})`}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
              Control total sobre tu <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Ecosistema</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Personaliza las capacidades de tu plataforma. Paga únicamente por lo que usas e instala nuevas herramientas con un solo clic, sin descargas ni configuraciones complejas.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
             <div className="flex-1 md:flex-none bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 min-w-[180px] shadow-inner backdrop-blur-xl">
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Crown className="w-3.5 h-3.5 text-emerald-400" />
                 Módulos en Plan
               </p>
               <p className="text-4xl font-black text-white">{activeModules?.planModules.length || 0}</p>
             </div>
             <div className="flex-1 md:flex-none bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 min-w-[180px] shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)] backdrop-blur-xl">
               <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5" />
                 Add-ons Extra
               </p>
               <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{activeModules?.addonModules.length || 0}</p>
             </div>
          </div>
        </div>
      </div>

      {/* ── App Store Interno ── */}
      <div className="space-y-16">
        
        {/* Core Modules */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Store className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Operación Base y Ventas</h3>
          </div>
          <p className="text-sm text-slate-400 ml-11 mb-2">Expande la gestión comercial y operativa del Punto de Venta.</p>
          {renderModuleGrid(coreCodes, Store, "from-blue-500 to-cyan-500", "shadow-blue-500/30")}
        </section>

        {/* Integraciones */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Plug className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">E-commerce e Integraciones</h3>
          </div>
          <p className="text-sm text-slate-400 ml-11 mb-2">Conecta tu tienda física con Shopify, WooCommerce y Transbank.</p>
          {renderModuleGrid(integrationsCodes, Plug, "from-amber-500 to-orange-500", "shadow-amber-500/30")}
        </section>

        {/* DTE */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Documentos Tributarios (SII)</h3>
          </div>
          <p className="text-sm text-slate-400 ml-11 mb-2">Emisión automática de Boletas, Facturas y Notas de Crédito.</p>
          {renderModuleGrid(dteCodes, FileText, "from-purple-500 to-pink-500", "shadow-purple-500/30")}
        </section>

      </div>
      </div>
    </DashboardLayout>
  );
}
