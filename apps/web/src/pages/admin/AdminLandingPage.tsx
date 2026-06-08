import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Globe, Loader2, Save, RotateCcw, ExternalLink,
  Sparkles, Layout, Tag, Megaphone, AlignLeft, Plus, Trash2, RefreshCw,
  Bot, MessageSquare, Search
} from 'lucide-react';

interface FeatureItem { title: string; description: string }

interface LandingConfig {
  hero: {
    badge: string; title: string; titleHighlight: string;
    description: string; ctaPrimary: string; ctaSecondary: string; dteBanner: string;
  };
  features: { sectionTitle: string; sectionSubtitle: string; items: FeatureItem[] };
  pricing: { title: string; subtitle: string };
  cta: { title: string; subtitle: string; button: string };
  footer: { description: string };
  seo: { title: string; description: string; keywords: string };
  chatbot: { enabled: boolean; welcomeMessage: string; options: string[] };
}

const DEFAULT_CFG: LandingConfig = {
  hero: {
    badge: 'Plataforma B2B para PYMES',
    title: 'Mucho más que un POS: El Sistema de Gestión',
    titleHighlight: 'Integral para tu Empresa',
    description: 'Centraliza tus ventas, inventario, proveedores y sucursales en una única plataforma en la nube diseñada para acelerar tu crecimiento.',
    ctaPrimary: 'Comenzar gratis',
    ctaSecondary: 'Ver Planes',
    dteBanner: 'Además, incluye Facturación Electrónica DTE integrada con el SII.',
  },
  features: {
    sectionTitle: 'Todo lo necesario para organizar tu empresa',
    sectionSubtitle: 'NexoPOS te entrega herramientas profesionales diseñadas específicamente para un control riguroso operativo y comercial.',
    items: [],
  },
  pricing: { title: 'Planes escalables para tu crecimiento', subtitle: 'Invierte en la tecnología correcta sin contratos forzosos. Elige el plan que soporte tu operación actual.' },
  cta: { title: '¿Listo para transformar la gestión de tu empresa?', subtitle: 'Únete a las empresas que ya digitalizaron sus operaciones con NexoPOS.', button: 'Comenzar 15 Días Gratis' },
  footer: { description: 'El sistema inteligente para centralizar ventas, sucursales y operaciones B2B.' },
  seo: {
    title: 'NexoPOS - El Sistema de Gestión Integral',
    description: 'Centraliza tus ventas, inventario, proveedores y sucursales en una única plataforma B2B.',
    keywords: 'pos, punto de venta, gestion, inventario, dte, chile'
  },
  chatbot: {
    enabled: true,
    welcomeMessage: '¡Hola! Soy tu asistente inteligente NexoPOS. ¿En qué te puedo ayudar hoy?',
    options: ['Ventas / Planes', 'Soporte', 'Facturación']
  }
};

type Tab = 'hero' | 'features' | 'pricing' | 'cta' | 'footer' | 'seo' | 'chatbot';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'hero', label: 'Hero', Icon: Sparkles },
  { key: 'features', label: 'Características', Icon: Layout },
  { key: 'pricing', label: 'Precios', Icon: Tag },
  { key: 'cta', label: 'CTA', Icon: Megaphone },
  { key: 'footer', label: 'Footer', Icon: AlignLeft },
  { key: 'seo', label: 'SEO', Icon: Search },
  { key: 'chatbot', label: 'Chatbot', Icon: MessageSquare },
];

const Field = ({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
      />
    )}
  </div>
);

export default function AdminLandingPage() {
  const [cfg, setCfg] = useState<LandingConfig>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [dirty, setDirty] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/landing');
      if (data) {
        setCfg(prev => deepMerge(prev, data));
      }
    } catch {
      toast.error('Error al cargar la configuración de la landing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key of Object.keys(override ?? {})) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = deepMerge(base[key] ?? {}, override[key]);
      } else if (override[key] !== undefined && override[key] !== null) {
        result[key] = override[key];
      }
    }
    return result;
  }

  const set = (section: keyof LandingConfig, patch: any) => {
    setCfg(prev => ({ ...prev, [section]: { ...(prev[section] as any), ...patch } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/landing', cfg);
      toast.success('Landing actualizada correctamente');
      setDirty(false);
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restablecer a los valores por defecto? Se perderán los cambios guardados.')) return;
    await api.put('/admin/landing', DEFAULT_CFG);
    setCfg(DEFAULT_CFG);
    setDirty(false);
    toast.success('Landing restablecida a valores por defecto');
  };

  const addFeatureItem = () => {
    set('features', { items: [...cfg.features.items, { title: '', description: '' }] });
  };

  const updateFeatureItem = (i: number, patch: Partial<FeatureItem>) => {
    const items = cfg.features.items.map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set('features', { items });
  };

  const removeFeatureItem = (i: number) => {
    set('features', { items: cfg.features.items.filter((_, idx) => idx !== i) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-neutral-500">
        <Loader2 size={20} className="animate-spin" />Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe size={22} className="text-purple-400" />Landing Page
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">Edita el contenido de la página pública de NexoPOS</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/landing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white text-xs font-medium transition-colors"
          >
            <ExternalLink size={13} />Ver landing
          </a>
          <button
            onClick={fetchConfig}
            className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Recargar"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
          >
            <RotateCcw size={14} />Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20 text-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Tienes cambios sin guardar
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-700">
        <nav className="flex gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                ${activeTab === key ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Hero */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-white">Encabezado principal</p>
            <Field label="Badge / Chip" value={cfg.hero.badge} onChange={v => set('hero', { badge: v })} placeholder="Ej. Plataforma B2B para PYMES" />
            <Field label="Título" value={cfg.hero.title} onChange={v => set('hero', { title: v })} placeholder="Ej. Mucho más que un POS" />
            <Field label="Título destacado (en color)" value={cfg.hero.titleHighlight} onChange={v => set('hero', { titleHighlight: v })} placeholder="Ej. Integral para tu Empresa" />
            <Field label="Descripción" value={cfg.hero.description} onChange={v => set('hero', { description: v })} multiline placeholder="Descripción breve del producto..." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Botón primario" value={cfg.hero.ctaPrimary} onChange={v => set('hero', { ctaPrimary: v })} placeholder="Comenzar gratis" />
              <Field label="Botón secundario" value={cfg.hero.ctaSecondary} onChange={v => set('hero', { ctaSecondary: v })} placeholder="Ver Planes" />
            </div>
            <Field label="Banner DTE" value={cfg.hero.dteBanner} onChange={v => set('hero', { dteBanner: v })} placeholder="Texto del banner inferior del hero..." />
          </div>
        </div>
      )}

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-white">Encabezado de la sección</p>
            <Field label="Título de sección" value={cfg.features.sectionTitle} onChange={v => set('features', { sectionTitle: v })} />
            <Field label="Subtítulo de sección" value={cfg.features.sectionSubtitle} onChange={v => set('features', { sectionSubtitle: v })} multiline />
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">Características ({cfg.features.items.length})</p>
              <button
                onClick={addFeatureItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} />Añadir
              </button>
            </div>
            <div className="space-y-3">
              {cfg.features.items.length === 0 ? (
                <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                  Sin características. Haz clic en "Añadir" para agregar.
                </div>
              ) : cfg.features.items.map((item, i) => (
                <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Característica {i + 1}</span>
                    <button onClick={() => removeFeatureItem(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Field label="Título" value={item.title} onChange={v => updateFeatureItem(i, { title: v })} placeholder="Ej. Control Multisucursal" />
                  <Field label="Descripción" value={item.description} onChange={v => updateFeatureItem(i, { description: v })} multiline placeholder="Descripción de la característica..." />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pricing */}
      {activeTab === 'pricing' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-white">Sección de precios</p>
          <p className="text-xs text-neutral-500">Los planes se muestran automáticamente desde la configuración de planes.</p>
          <Field label="Título" value={cfg.pricing.title} onChange={v => set('pricing', { title: v })} />
          <Field label="Subtítulo" value={cfg.pricing.subtitle} onChange={v => set('pricing', { subtitle: v })} multiline />
        </div>
      )}

      {/* Tab: CTA */}
      {activeTab === 'cta' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-white">Llamada a la acción (Call to Action)</p>
          <Field label="Título" value={cfg.cta.title} onChange={v => set('cta', { title: v })} />
          <Field label="Subtítulo" value={cfg.cta.subtitle} onChange={v => set('cta', { subtitle: v })} multiline />
          <Field label="Texto del botón" value={cfg.cta.button} onChange={v => set('cta', { button: v })} placeholder="Comenzar 15 Días Gratis" />
        </div>
      )}

      {/* Tab: Footer */}
      {activeTab === 'footer' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-white">Pie de página</p>
          <Field label="Descripción del footer" value={cfg.footer.description} onChange={v => set('footer', { description: v })} multiline />
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-white">Metadatos de Buscadores (SEO)</p>
          <p className="text-xs text-neutral-500">Estos textos aparecerán en Google y al compartir el link en redes sociales.</p>
          <Field label="Título (Meta Title)" value={cfg.seo?.title || ''} onChange={v => set('seo', { ...cfg.seo, title: v })} placeholder="NexoPOS - El Sistema de Gestión Integral" />
          <Field label="Descripción (Meta Description)" value={cfg.seo?.description || ''} onChange={v => set('seo', { ...cfg.seo, description: v })} multiline placeholder="Centraliza tus ventas, inventario..." />
          <Field label="Palabras Clave (Keywords)" value={cfg.seo?.keywords || ''} onChange={v => set('seo', { ...cfg.seo, keywords: v })} placeholder="pos, punto de venta, gestion" />
        </div>
      )}

      {/* Tab: Chatbot */}
      {activeTab === 'chatbot' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Asistente Inteligente Público</p>
              <p className="text-xs text-neutral-500">Muestra un chat de triaje en la landing page para captar prospectos o derivar soporte.</p>
            </div>
            <button
              onClick={() => set('chatbot', { ...cfg.chatbot, enabled: !cfg.chatbot?.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cfg.chatbot?.enabled ? 'bg-purple-600' : 'bg-neutral-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cfg.chatbot?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className={`space-y-4 pt-4 border-t border-neutral-700 ${!cfg.chatbot?.enabled && 'opacity-50 pointer-events-none'}`}>
            <Field label="Mensaje de bienvenida" value={cfg.chatbot?.welcomeMessage || ''} onChange={v => set('chatbot', { ...cfg.chatbot, welcomeMessage: v })} multiline placeholder="¡Hola! Soy tu asistente inteligente NexoPOS..." />
            
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide">Opciones Rápidas (Botones)</label>
              <p className="text-[11px] text-neutral-500 mb-2">Ingresa las opciones separadas por comas.</p>
              <input
                type="text"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                value={(cfg.chatbot?.options || []).join(', ')}
                onChange={e => set('chatbot', { ...cfg.chatbot, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Ej. Ventas / Planes, Soporte, Facturación"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
