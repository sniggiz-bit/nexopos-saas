import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Check, X, Star, Users,
  DollarSign, Loader2, CheckCheck, Tag, Info, Zap, ListChecks,
  Store, CreditCard, Plug, FileText, RefreshCw, ShoppingCart, 
  Building, Receipt, FileMinus, Truck, ShoppingBag, Wifi,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlanFeatures {
  enableEcommerce: boolean;
  enableTransbank: boolean;
  enableIntegrations: boolean;
  enableBoletaDte: boolean;
  enableFacturaDte: boolean;
  enableGuiaDespachoDte: boolean;
  enableNotaCreditoDte: boolean;
}

export interface ModuleDef {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  features?: string[];
  maxUsers: number;
  maxProducts: number;
  maxStorage: number;
  isRecommended?: boolean;
  enabledFeatures?: PlanFeatures | null; // legacy
  planModules?: { module: ModuleDef }[];
  moduleCodes?: string[];
}

type Tab = 'identity' | 'price' | 'functions' | 'features';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'identity', label: 'Identidad', Icon: Info },
  { key: 'price', label: 'Precio', Icon: DollarSign },
  { key: 'functions', label: 'Funciones', Icon: Zap },
  { key: 'features', label: 'Características', Icon: ListChecks },
];

const DEFAULT_FEATURES: PlanFeatures = {
  enableEcommerce: false,
  enableTransbank: false,
  enableIntegrations: false,
  enableBoletaDte: false,
  enableFacturaDte: false,
  enableGuiaDespachoDte: false,
  enableNotaCreditoDte: false,
};

const EMPTY_FORM: Partial<Plan> = {
  name: '', description: '', price: 0,
  maxUsers: 5, maxProducts: 500, maxStorage: 512,
  isRecommended: false, features: [],
  enabledFeatures: { ...DEFAULT_FEATURES },
  moduleCodes: [],
};

// ── Primitives ─────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-purple-500' : 'bg-neutral-600'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const ToggleRow = ({ icon: Icon, label, desc, checked, onChange, color = 'text-purple-400' }: {
  icon: React.ElementType; label: string; desc: string;
  checked: boolean; onChange: (v: boolean) => void; color?: string;
}) => (
  <div className="flex items-center justify-between py-3.5 border-b border-neutral-700/50 last:border-0">
    <div className="flex items-center gap-3 flex-1 mr-4">
      <div className="p-2 rounded-lg bg-neutral-900/60"><Icon size={15} className={color} /></div>
      <div>
        <p className="text-sm font-medium text-neutral-200">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const NumInput = ({ label, desc, value, onChange, min = 1 }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; min?: number;
}) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex-1 mr-4">
      <p className="text-sm font-medium text-neutral-200">{label}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center text-sm font-bold transition-colors">−</button>
      <span className="w-10 text-center text-sm font-bold text-white tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center text-sm font-bold transition-colors">+</button>
    </div>
  </div>
);

// ── Plan Card ──────────────────────────────────────────────────────────────────

const PlanCard = ({ plan, onEdit, onDelete }: { plan: Plan; onEdit: () => void; onDelete: () => void }) => {
  const activeFeats = plan.planModules?.map(pm => pm.module) || [];

  return (
    <div className={`bg-neutral-800 border ${plan.isRecommended ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-neutral-700'} rounded-xl p-5 relative`}>
      {plan.isRecommended && (
        <div className="absolute -top-2.5 left-5">
          <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Star size={9} />Más popular
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
          {plan.description && (
            <p className="text-xs text-neutral-400 mb-3 line-clamp-1">{plan.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-700/60 text-neutral-300 text-xs">
              <Users size={11} className="text-neutral-400" />{plan.maxUsers} usuarios
            </span>
            {activeFeats.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
                <Zap size={11} />{activeFeats.length} módulo{activeFeats.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {activeFeats.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {activeFeats.slice(0, 4).map(f => (
                <span key={f.code} className="inline-flex items-center gap-1 text-xs text-neutral-400">
                  <Check size={10} className="text-purple-400 flex-shrink-0" />{f.name}
                </span>
              ))}
              {activeFeats.length > 4 && (
                <span className="text-xs text-neutral-600">+{activeFeats.length - 4} más</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-400">${plan.price.toLocaleString('es-CL')}</p>
            <p className="text-xs text-neutral-500">/mes</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-white text-xs font-medium transition-colors">
              <Edit2 size={12} />Editar
            </button>
            <button onClick={onDelete}
              className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Drawer ─────────────────────────────────────────────────────────────────────

function PlanDrawer({ plan, modules, onClose, onSaved }: { plan: Partial<Plan>; modules: ModuleDef[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!plan.id;
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [form, setForm] = useState<Partial<Plan>>({
    ...EMPTY_FORM,
    ...plan,
    moduleCodes: plan.planModules ? plan.planModules.map(pm => pm.module.code) : [],
    enabledFeatures: { ...DEFAULT_FEATURES, ...(plan.enabledFeatures ?? {}) },
  });
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (p: Partial<Plan>) => setForm(prev => ({ ...prev, ...p }));


  const toggleModule = (code: string, checked: boolean) => {
    const current = form.moduleCodes || [];
    if (checked && !current.includes(code)) {
      set({ moduleCodes: [...current, code] });
    } else if (!checked) {
      set({ moduleCodes: current.filter(c => c !== code) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/plans/${form.id}`, form);
        toast.success('Plan actualizado');
      } else {
        await api.post('/plans', form);
        toast.success('Plan creado correctamente');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(`Error al guardar el plan${err?.response?.status ? ` (${err.response.status})` : ''}`);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    set({ features: [...(form.features ?? []), newFeature.trim()] });
    setNewFeature('');
  };

  const removeFeature = (i: number) => {
    const features = [...(form.features ?? [])];
    features.splice(i, 1);
    set({ features });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdit ? (form.name || 'Editar Plan') : 'Nuevo Plan'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isEdit ? 'Modifica la configuración del plan' : 'Configura un nuevo plan de suscripción'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-800">
          <nav className="flex">
            {TABS.map(({ key, label, Icon }) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors -mb-px flex-1 justify-center
                  ${activeTab === key ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">

            {/* Tab: Identidad */}
            {activeTab === 'identity' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Nombre del plan</label>
                  <input type="text" required value={form.name ?? ''}
                    onChange={e => set({ name: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                    placeholder="Ej. Plan Profesional" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Descripción corta</label>
                  <textarea value={form.description ?? ''} onChange={e => set({ description: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none h-24"
                    placeholder="Descripción visible en la landing page..." />
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Plan destacado</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Se muestra como "Más popular" en la landing</p>
                  </div>
                  <Toggle checked={form.isRecommended ?? false} onChange={v => set({ isRecommended: v })} />
                </div>
              </div>
            )}

            {/* Tab: Precio */}
            {activeTab === 'price' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Precio mensual (CLP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">$</span>
                    <input type="number" required min={0} value={form.price ?? ''}
                      onChange={e => set({ price: Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-8 pr-16 py-3.5 text-white text-xl font-bold focus:outline-none focus:border-purple-500 transition-colors tabular-nums"
                      placeholder="0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-medium">CLP</span>
                  </div>
                </div>
                {(form.price ?? 0) > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 space-y-2">
                    <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Vista previa</p>
                    <p className="text-3xl font-bold text-purple-400">${(form.price ?? 0).toLocaleString('es-CL')}</p>
                    <p className="text-xs text-purple-300/60">por mes · por empresa</p>
                    <div className="pt-3 border-t border-purple-500/20 flex justify-between text-xs text-purple-300/50">
                      <span>Anual estimado</span>
                      <span>${((form.price ?? 0) * 12).toLocaleString('es-CL')}/año</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Funciones */}
            {activeTab === 'functions' && (
              <div className="space-y-5">
                {/* Límite de usuarios */}
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                  <p className="text-sm font-bold text-white mb-1">Límite de usuarios</p>
                  <p className="text-xs text-neutral-500 mb-3">Máximo de usuarios incluidos en el plan</p>
                  <NumInput
                    label="Usuarios"
                    desc="Cuentas de usuario permitidas"
                    value={form.maxUsers ?? 1}
                    onChange={v => set({ maxUsers: v })}
                    min={1}
                  />
                </div>

                {/* Módulos Core */}
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                  <p className="text-sm font-bold text-white mb-0.5">Operación Base (Core)</p>
                  <p className="text-xs text-neutral-500 mb-4">Funciones esenciales de administración y venta</p>
                  {modules.filter(m => ['POS', 'QUOTES', 'CUSTOMERS', 'EXTRA_BRANCH', 'CREDITS'].includes(m.code)).map(m => {
                    const iconMap: Record<string, any> = { POS: [ShoppingCart, 'text-blue-400'], QUOTES: [FileText, 'text-sky-400'], CUSTOMERS: [Users, 'text-indigo-400'], EXTRA_BRANCH: [Building, 'text-violet-400'], CREDITS: [CreditCard, 'text-cyan-400'] };
                    const [IconComp, color] = iconMap[m.code] || [Store, 'text-blue-400'];
                    return (
                      <ToggleRow key={m.code} icon={IconComp} label={m.name} desc={m.description}
                        checked={form.moduleCodes?.includes(m.code) || false} onChange={v => toggleModule(m.code, v)} color={color} />
                    );
                  })}
                </div>

                {/* Integraciones */}
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                  <p className="text-sm font-bold text-white mb-0.5">E-commerce e Integraciones</p>
                  <p className="text-xs text-neutral-500 mb-4">Canales de venta digitales y pagos</p>
                  {modules.filter(m => ['ECOMMERCE', 'SHOPIFY', 'WOOCOMMERCE', 'TRANSBANK'].includes(m.code)).map(m => {
                    const iconMap: Record<string, any> = { ECOMMERCE: [ShoppingBag, 'text-amber-400'], SHOPIFY: [ShoppingBag, 'text-orange-400'], WOOCOMMERCE: [ShoppingBag, 'text-yellow-400'], TRANSBANK: [Wifi, 'text-rose-400'] };
                    const [IconComp, color] = iconMap[m.code] || [Plug, 'text-amber-400'];
                    return (
                      <ToggleRow key={m.code} icon={IconComp} label={m.name} desc={m.description}
                        checked={form.moduleCodes?.includes(m.code) || false} onChange={v => toggleModule(m.code, v)} color={color} />
                    );
                  })}
                </div>

                {/* DTE */}
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                  <p className="text-sm font-bold text-white mb-0.5">Documentos Tributarios (DTE)</p>
                  <p className="text-xs text-neutral-500 mb-4">Módulos SII Chile habilitados en el plan</p>
                  {modules.filter(m => ['DTE_BOLETA', 'DTE_FACTURA', 'DTE_NOTA_CREDITO', 'DTE_GUIA_DESPACHO'].includes(m.code)).map(m => {
                    const iconMap: Record<string, any> = { DTE_BOLETA: [Receipt, 'text-emerald-400'], DTE_FACTURA: [FileText, 'text-green-400'], DTE_NOTA_CREDITO: [FileMinus, 'text-teal-400'], DTE_GUIA_DESPACHO: [Truck, 'text-lime-400'] };
                    const [IconComp, color] = iconMap[m.code] || [FileText, 'text-purple-400'];
                    return (
                      <ToggleRow key={m.code} icon={IconComp} label={m.name} desc={m.description}
                        checked={form.moduleCodes?.includes(m.code) || false} onChange={v => toggleModule(m.code, v)} color={color} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Características */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input type="text" value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    placeholder="Ej. Soporte prioritario 24/7"
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors" />
                  <button type="button" onClick={addFeature} disabled={!newFeature.trim()}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium flex-shrink-0">
                    <Plus size={15} />Añadir
                  </button>
                </div>
                {(!form.features || form.features.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500 border border-dashed border-neutral-700 rounded-xl">
                    <ListChecks size={30} className="mb-2 opacity-30" />
                    <p className="text-sm font-medium">Sin características</p>
                    <p className="text-xs mt-1">Escribe arriba y presiona Añadir o Enter</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 group">
                        <Check size={14} className="text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-neutral-200 flex-1">{feature}</span>
                        <button type="button" onClick={() => removeFeature(i)}
                          className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-red-500/10">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-800 space-y-2">
            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Plan'}
            </button>
            <button type="button" onClick={onClose}
              className="w-full py-2.5 rounded-xl text-neutral-400 hover:text-white text-sm font-medium transition-colors hover:bg-neutral-800">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerPlan, setDrawerPlan] = useState<Partial<Plan> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, modulesRes] = await Promise.all([
        api.get('/plans'),
        api.get('/modules')
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setModules(Array.isArray(modulesRes.data) ? modulesRes.data : []);
    } catch (err: any) {
      const status = err?.response?.status;
      toast.error(
        status === 403 ? 'Sin permisos para ver planes (403)'
          : status === 401 ? 'Sesión expirada, por favor recarga'
          : `Error cargando datos${status ? ` (${status})` : ''}`,
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => setDrawerPlan({});
  const openEdit = (plan: Plan) => setDrawerPlan(plan);
  const closeDrawer = () => setDrawerPlan(null);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar el plan "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/plans/${id}`);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan eliminado');
    } catch {
      toast.error('Error al eliminar el plan');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-neutral-500">
      <Loader2 size={20} className="animate-spin" />Cargando planes...
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Planes y Precios</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              {plans.length} plan{plans.length !== 1 ? 'es' : ''} configurado{plans.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors border border-neutral-700"
              title="Recargar">
              <RefreshCw size={15} />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20 text-sm">
              <Plus size={17} />Nuevo Plan
            </button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 border border-dashed border-neutral-700 rounded-xl">
            <Tag size={36} className="mb-3 opacity-25" />
            <p className="font-semibold text-neutral-400">Sin planes configurados</p>
            <p className="text-sm mt-1">Crea el primer plan de suscripción</p>
            <button onClick={openCreate}
              className="mt-5 flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
              <Plus size={15} />Crear primer plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan}
                onEdit={() => openEdit(plan)}
                onDelete={() => handleDelete(plan.id, plan.name)} />
            ))}
          </div>
        )}
      </div>

      {drawerPlan !== null && (
        <PlanDrawer plan={drawerPlan} modules={modules} onClose={closeDrawer} onSaved={fetchData} />
      )}
    </>
  );
}
