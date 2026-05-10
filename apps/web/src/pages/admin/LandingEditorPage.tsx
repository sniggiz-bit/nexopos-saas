import { useEffect, useState } from 'react';
import { Save, Eye, Loader2, CheckCircle2, Layout, Zap, DollarSign, Megaphone, FileText } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface FeatureItem { title: string; description: string; }

interface LandingConfig {
  hero: {
    badge: string; title: string; titleHighlight: string;
    description: string; ctaPrimary: string; ctaSecondary: string; dteBanner: string;
  };
  features: { sectionTitle: string; sectionSubtitle: string; items: FeatureItem[] };
  pricing: { title: string; subtitle: string };
  cta: { title: string; subtitle: string; button: string };
  footer: { description: string };
}

const DEFAULT: LandingConfig = {
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
    items: [
      { title: 'Gestión de Cotizaciones', description: 'Crea cotizaciones profesionales en segundos. Convierte propuestas comerciales en ventas cerradas con un solo clic, manteniendo el historial completo de la negociación con tus clientes.' },
      { title: 'Control Multisucursal', description: 'Administra múltiples locales desde un panel centralizado. Visualiza el stock de cada bodega en tiempo real, realiza transferencias de inventario e inspecciona reportes consolidados por sede.' },
      { title: 'Proveedores y Compras', description: 'Abastece tu negocio inteligentemente. Registra órdenes de compra, actualiza tus costos promedio automáticamente y mantén un directorio organizado de todos tus proveedores clave.' },
      { title: 'Tienda Online Sincronizada', description: 'Expande tus canales de venta de forma digital. Tu catálogo físico y online comparten el mismo inventario, evitando quiebres de stock y automatizando el flujo completo desde la venta hasta el despacho.' },
    ],
  },
  pricing: {
    title: 'Planes escalables para tu crecimiento',
    subtitle: 'Invierte en la tecnología correcta sin contratos forzosos. Elige el plan que soporte tu operación actual.',
  },
  cta: {
    title: '¿Listo para transformar la gestión de tu empresa?',
    subtitle: 'Únete a las empresas que ya digitalizaron sus operaciones con NexoPOS.',
    button: 'Comenzar 15 Días Gratis',
  },
  footer: { description: 'El sistema inteligente para centralizar ventas, sucursales y operaciones B2B.' },
};

type Tab = 'hero' | 'features' | 'pricing' | 'cta';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'hero', label: 'Hero', icon: Layout },
  { key: 'features', label: 'Características', icon: Zap },
  { key: 'pricing', label: 'Precios & CTA', icon: DollarSign },
  { key: 'cta', label: 'Footer', icon: FileText },
];

const Field = ({ label, value, onChange, multiline = false, rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; rows?: number; placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
    {multiline ? (
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 resize-none"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
      />
    )}
  </div>
);

export default function LandingEditorPage() {
  const [cfg, setCfg] = useState<LandingConfig>(DEFAULT);
  const [tab, setTab] = useState<Tab>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/landing')
      .then(res => { if (res.data) setCfg(prev => deepMerge(prev, res.data)); })
      .catch(() => { /* usa defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const set = <S extends keyof LandingConfig>(section: S, patch: Partial<LandingConfig[S]>) =>
    setCfg(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const setFeatureItem = (idx: number, patch: Partial<FeatureItem>) =>
    setCfg(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.map((item, i) => i === idx ? { ...item, ...patch } : item),
      },
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/landing', cfg);
      setSaved(true);
      toast.success('Landing page guardada');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-neutral-500">
      <Loader2 className="animate-spin" size={20} />Cargando...
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editor de Landing Page</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Los cambios se reflejan instantáneamente en la página pública.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/landing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm transition-colors"
          >
            <Eye size={16} />
            Ver Landing
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-800/50 border border-neutral-700 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 space-y-5">

        {/* ── HERO TAB ── */}
        {tab === 'hero' && (
          <>
            <SectionTitle icon={Megaphone} title="Sección Hero" />
            <Field label="Badge (etiqueta pequeña)" value={cfg.hero.badge} onChange={v => set('hero', { badge: v })} placeholder="Plataforma B2B para PYMES" />
            <Field label="Título principal (texto normal)" value={cfg.hero.title} onChange={v => set('hero', { title: v })} placeholder="Mucho más que un POS..." />
            <Field label="Título principal (parte degradado)" value={cfg.hero.titleHighlight} onChange={v => set('hero', { titleHighlight: v })} placeholder="Integral para tu Empresa" />
            <Field label="Descripción" value={cfg.hero.description} onChange={v => set('hero', { description: v })} multiline rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Botón primario (CTA)" value={cfg.hero.ctaPrimary} onChange={v => set('hero', { ctaPrimary: v })} />
              <Field label="Botón secundario" value={cfg.hero.ctaSecondary} onChange={v => set('hero', { ctaSecondary: v })} />
            </div>
            <Field label="Banner DTE (texto pequeño bajo CTAs)" value={cfg.hero.dteBanner} onChange={v => set('hero', { dteBanner: v })} />
          </>
        )}

        {/* ── FEATURES TAB ── */}
        {tab === 'features' && (
          <>
            <SectionTitle icon={Zap} title="Sección Características" />
            <Field label="Título de sección" value={cfg.features.sectionTitle} onChange={v => set('features', { sectionTitle: v })} />
            <Field label="Subtítulo de sección" value={cfg.features.sectionSubtitle} onChange={v => set('features', { sectionSubtitle: v })} multiline rows={2} />

            <div className="border-t border-neutral-700 pt-5 space-y-6">
              {cfg.features.items.map((item, i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-700/60 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Característica {i + 1}</p>
                  <Field label="Título" value={item.title} onChange={v => setFeatureItem(i, { title: v })} />
                  <Field label="Descripción" value={item.description} onChange={v => setFeatureItem(i, { description: v })} multiline rows={3} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PRICING & CTA TAB ── */}
        {tab === 'pricing' && (
          <>
            <SectionTitle icon={DollarSign} title="Sección Precios" />
            <p className="text-xs text-neutral-500">Los planes se gestionan en <strong className="text-neutral-400">Admin → Planes</strong>. Aquí solo editas los textos del encabezado.</p>
            <Field label="Título de sección precios" value={cfg.pricing.title} onChange={v => set('pricing', { title: v })} />
            <Field label="Subtítulo de sección precios" value={cfg.pricing.subtitle} onChange={v => set('pricing', { subtitle: v })} multiline rows={2} />

            <div className="border-t border-neutral-700 pt-5 space-y-4">
              <SectionTitle icon={Megaphone} title="CTA Final (sección indigo)" />
              <Field label="Título del CTA" value={cfg.cta.title} onChange={v => set('cta', { title: v })} />
              <Field label="Subtítulo del CTA" value={cfg.cta.subtitle} onChange={v => set('cta', { subtitle: v })} />
              <Field label="Texto del botón CTA" value={cfg.cta.button} onChange={v => set('cta', { button: v })} />
            </div>
          </>
        )}

        {/* ── FOOTER TAB ── */}
        {tab === 'cta' && (
          <>
            <SectionTitle icon={FileText} title="Footer" />
            <Field label="Descripción del footer (bajo el logo)" value={cfg.footer.description} onChange={v => set('footer', { description: v })} multiline rows={2} />

            <div className="mt-4 p-4 bg-neutral-900/60 rounded-xl border border-neutral-700/50 space-y-1.5">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Vista previa del footer</p>
              <p className="text-sm text-white font-bold">NexoPOS</p>
              <p className="text-xs text-neutral-400">{cfg.footer.description}</p>
            </div>
          </>
        )}
      </div>

      {/* Preview hint */}
      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <Eye size={12} />
        <span>Los cambios se aplican al guardar. Abre la landing en una pestaña nueva para ver el resultado.</span>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon size={16} className="text-purple-400" />
      <h3 className="text-sm font-bold text-white">{title}</h3>
    </div>
  );
}

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
