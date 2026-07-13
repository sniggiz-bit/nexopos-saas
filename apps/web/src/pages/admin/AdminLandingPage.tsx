import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Globe, Loader2, Save, RotateCcw, ExternalLink,
  Sparkles, Layout, Tag, Megaphone, AlignLeft, Plus, Trash2, RefreshCw,
  MessageSquare, Search, Frown, Lightbulb, Briefcase, BarChart3,
  Users, Scale, HelpCircle, Upload, Image as ImageIcon2
} from 'lucide-react';

interface FeatureItem { title: string; description: string }
interface PainItem { title: string; description: string }
interface UseCaseItem { title: string; description: string }
interface StatItem { label: string; value: string }
interface TestimonialItem { name: string; role: string; content: string }
interface ComparisonRow { feature: string; nexopos: string; excel: string; traditional: string }
interface FaqItem { question: string; answer: string }

interface LandingConfig {
  hero: {
    badge: string; title: string; titleHighlight: string;
    description: string; ctaPrimary: string; ctaSecondary: string; dteBanner: string; image?: string;
  };
  pain: { title: string; subtitle: string; items: PainItem[] };
  solution: { title: string; subtitle: string; description: string; image?: string; };
  features: { sectionTitle: string; sectionSubtitle: string; items: FeatureItem[] };
  useCases: { title: string; subtitle: string; items: UseCaseItem[] };
  stats: { items: StatItem[] };
  testimonials: { items: TestimonialItem[] };
  comparison: { title: string; subtitle: string; rows: ComparisonRow[] };
  pricing: { title: string; subtitle: string };
  faqs: { title: string; subtitle: string; items: FaqItem[] };
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
  pain: {
    title: 'Dirigir un negocio es difícil. Administrarlo a ciegas es peligroso.',
    subtitle: 'EL CAOS OPERATIVO DIARIO',
    items: [
      { title: 'Inventarios Descuadrados', description: 'Nunca sabes con certeza qué hay en bodega. Vendes productos sin stock en tu tienda online y pierdes clientes por quiebres en sala de venta.' },
      { title: 'El SII consume tu tiempo', description: 'Emitir facturas o boletas a mano o en sistemas lentos te quita horas valiosas al final del día. Un error manual y te expones a multas.' },
      { title: 'Sucursales Desconectadas', description: 'No sabes cuál local vende más hoy, qué caja está cuadrada o si hay robo hormiga a menos que vayas físicamente a inspeccionar.' }
    ]
  },
  solution: {
    title: 'Toda tu operación comercial en piloto automático.',
    subtitle: 'NEXOPOS AL RESCATE',
    description: 'NexoPOS centraliza las partes más difíciles de tu negocio en una interfaz limpia, veloz y accesible desde cualquier dispositivo. Deja atrás las planillas de Excel y los sistemas lentos de los años 90.',
    image: '',
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
  useCases: {
    title: 'Diseñado para el comercio real en Chile.',
    subtitle: 'SECTORES COMPATIBLES',
    items: [
      { title: 'Minimarkets y Almacenes', description: 'Lectura ultra rápida de código de barras, balanzas integradas y control de vencimientos.' },
      { title: 'Ferreterías y Repuestos', description: 'Gestión de miles de SKUs, equivalencias de productos y ventas mayoristas con cuentas corrientes de clientes.' },
      { title: 'Tiendas de Mascotas y Retail', description: 'Variantes de productos (talla, color, sabor), control de servicios y promociones dinámicas.' },
      { title: 'Distribuidoras y Mayoristas', description: 'Módulo de compras robusto, márgenes de ganancia por volumen y rutas de despacho automatizadas.' }
    ]
  },
  stats: {
    items: [
      { label: 'Empresas Activas en Chile', value: '+350' },
      { label: 'Transacciones Procesadas', value: '+15 Millones' },
      { label: 'Uptime del Servidor (AWS)', value: '99.98%' }
    ]
  },
  testimonials: {
    items: [
      { name: 'Francisco Pérez', role: 'Fundador de "Almacén Providencia"', content: 'NexoPOS nos permitió abrir 3 sedes en un año. Antes pasábamos el fin de semana cuadrando inventarios de forma manual; ahora todo se hace en tiempo real desde el celular.' },
      { name: 'Alejandra Fravéga', role: 'Gerente de Operaciones en "Distribuidora Ponchos del Cachapoal"', content: 'La facturación electrónica con el SII nunca falló. Tuvimos soporte de inmediato por WhatsApp el primer día que abrimos caja. Es un cambio del cielo a la tierra.' }
    ]
  },
  comparison: {
    title: 'NexoPOS vs Sistemas tradicionales y planillas',
    subtitle: 'COMPARATIVA CIENTÍFICA',
    rows: [
      { feature: 'Sincronización en la nube', nexopos: 'Sí, 100% Tiempo Real', excel: 'No (Archivos locales aislados)', traditional: 'A veces (Servidores locales lentos)' },
      { feature: 'Facturación DTE / SII', nexopos: 'Integrado Automáticamente', excel: 'No (Requiere doble digitación)', traditional: 'Requiere pago extra por integración' },
      { feature: 'Velocidad de venta POS', nexopos: 'Menos de 2 segundos', excel: 'Lento e ineficiente', traditional: 'Lento, requiere terminales específicas' },
      { feature: 'Soporte Técnico en Vivo', nexopos: 'Sí, WhatsApp Directo', excel: 'No (Tú lo resuelves solo)', traditional: 'Soporte telefónico costoso o ausente' },
      { feature: 'Conexión E-commerce', nexopos: 'Sí (Shopify & WooCommerce)', excel: 'No', traditional: 'No disponible' }
    ]
  },
  pricing: { title: 'Planes escalables para tu crecimiento', subtitle: 'Invierte en la tecnología correcta sin contratos forzosos. Elige el plan que soporte tu operación actual.' },
  faqs: {
    title: 'Preguntas Frecuentes',
    subtitle: 'Respuestas claras para eliminar objeciones antes de comenzar.',
    items: [
      { question: '¿Necesito comprar mi propio Certificado Digital para emitir boletas o facturas?', answer: 'No. NexoPOS incluye la gestión de firma digital y folios integrados en el plan. Nosotros nos encargamos de enrolar tu empresa ante el SII sin costo extra.' },
      { question: '¿Funciona el POS si se cae el internet?', answer: 'Sí. El Punto de Venta cuenta con un modo offline inteligente. Puedes seguir vendiendo y registrando pagos. Tan pronto vuelva la señal, los datos se sincronizan con la nube.' },
      { question: '¿Puedo importar mis productos desde Excel u otro sistema que ya utilizo?', answer: '¡Por supuesto! Nuestro panel cuenta con un importador masivo en Excel. Si tienes dificultades, nuestro equipo de soporte te asiste para migrar toda tu base de datos en menos de 1 hora.' },
      { question: '¿Tengo que firmar un contrato de permanencia mínima?', answer: 'No. El servicio se cobra de forma mensual y puedes cancelarlo o cambiar de plan cuando quieras sin multas ni costos extras.' },
      { question: '¿Qué pasa si excedo el límite de usuarios de mi plan?', answer: 'Puedes contratar usuarios adicionales como add-ons directamente desde tu panel de control a una fracción del costo, o subir al siguiente plan.' },
      { question: '¿NexoPOS es compatible con lectores de código de barra y gavetas de dinero?', answer: 'Sí, es compatible con el 99% de los hardwares POS USB y Bluetooth del mercado (lectores de barra, impresoras térmicas de 57mm y 80mm, y gavetas electrónicas).' },
      { question: '¿Cómo funciona la integración con Shopify y WooCommerce?', answer: 'Conectas tu tienda con tus credenciales API en un paso. Cuando vendes online, el stock baja en el POS de tu tienda física. Si vendes en el local, el inventario web se actualiza al instante.' },
      { question: '¿El soporte técnico está incluido en el precio?', answer: 'Sí, todos los planes incluyen soporte técnico nativo. Los planes intermedio y avanzado incluyen canal de WhatsApp prioritario con respuesta en menos de 15 minutos.' },
      { question: '¿Puedo manejar distintas tarifas o precios por volumen?', answer: 'Sí, NexoPOS te permite configurar escalas de precios (precios mayoristas, ofertas por cantidad) por producto.' },
      { question: '¿Los datos de mi negocio están seguros?', answer: 'Sí. Toda la información viaja encriptada vía SSL y se almacena en servidores AWS de alta seguridad con respaldos automatizados cada 6 horas.' }
    ]
  },
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

type Tab = 'hero' | 'pain' | 'solution' | 'features' | 'useCases' | 'stats' | 'testimonials' | 'comparison' | 'pricing' | 'faqs' | 'cta' | 'footer' | 'seo' | 'chatbot';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'hero', label: 'Hero', Icon: Sparkles },
  { key: 'pain', label: 'Dolores', Icon: Frown },
  { key: 'solution', label: 'Solución', Icon: Lightbulb },
  { key: 'features', label: 'Características', Icon: Layout },
  { key: 'useCases', label: 'Casos de Uso', Icon: Briefcase },
  { key: 'stats', label: 'Métricas', Icon: BarChart3 },
  { key: 'testimonials', label: 'Testimonios', Icon: Users },
  { key: 'comparison', label: 'Comparativa', Icon: Scale },
  { key: 'pricing', label: 'Precios', Icon: Tag },
  { key: 'faqs', label: 'Preguntas', Icon: HelpCircle },
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

const MediaUploadField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/uploads/image', form);
      onChange(data.url);
    } catch {
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const isVideo = value && (value.endsWith('.mp4') || value.endsWith('.webm'));

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-xl border border-dashed border-neutral-700 bg-neutral-800/50 flex items-center justify-center shrink-0 overflow-hidden relative group">
          {value ? (
            <>
              {isVideo ? (
                <video src={value} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={() => onChange('')} className="p-1.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/40 transition-colors"><Trash2 size={16} /></button>
              </div>
            </>
          ) : (
            <ImageIcon2 size={24} className="text-neutral-600" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Subiendo...' : 'Subir Media'}
          </button>
          <p className="text-xs text-neutral-500">Formato recomendado: PNG, JPG, WEBP, MP4, WEBM. Máx: 25MB.</p>
        </div>
      </div>
    </div>
  );
};

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
      } else if (Array.isArray(override[key]) && override[key].length === 0) {
        result[key] = base[key] || [];
      } else if (override[key] !== undefined && override[key] !== null && override[key] !== '') {
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

  const addPainItem = () => {
    set('pain', { items: [...(cfg.pain?.items || []), { title: '', description: '' }] });
  };

  const updatePainItem = (i: number, patch: Partial<PainItem>) => {
    const items = (cfg.pain?.items || []).map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set('pain', { items });
  };

  const removePainItem = (i: number) => {
    set('pain', { items: (cfg.pain?.items || []).filter((_, idx) => idx !== i) });
  };

  const addUseCaseItem = () => {
    set('useCases', { items: [...(cfg.useCases?.items || []), { title: '', description: '' }] });
  };

  const updateUseCaseItem = (i: number, patch: Partial<UseCaseItem>) => {
    const items = (cfg.useCases?.items || []).map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set('useCases', { items });
  };

  const removeUseCaseItem = (i: number) => {
    set('useCases', { items: (cfg.useCases?.items || []).filter((_, idx) => idx !== i) });
  };

  const addStatItem = () => {
    set('stats', { items: [...(cfg.stats?.items || []), { label: '', value: '' }] });
  };

  const updateStatItem = (i: number, patch: Partial<StatItem>) => {
    const items = (cfg.stats?.items || []).map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set('stats', { items });
  };

  const removeStatItem = (i: number) => {
    set('stats', { items: (cfg.stats?.items || []).filter((_, idx) => idx !== i) });
  };

  const addTestimonialItem = () => {
    set('testimonials', { items: [...(cfg.testimonials?.items || []), { name: '', role: '', content: '' }] });
  };

  const updateTestimonialItem = (i: number, patch: Partial<TestimonialItem>) => {
    const items = (cfg.testimonials?.items || []).map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set('testimonials', { items });
  };

  const removeTestimonialItem = (i: number) => {
    set('testimonials', { items: (cfg.testimonials?.items || []).filter((_, idx) => idx !== i) });
  };

  const addComparisonRow = () => {
    set('comparison', { rows: [...(cfg.comparison?.rows || []), { feature: '', nexopos: '', excel: '', traditional: '' }] });
  };

  const updateComparisonRow = (i: number, patch: Partial<ComparisonRow>) => {
    const rows = (cfg.comparison?.rows || []).map((row, idx) => idx === i ? { ...row, ...patch } : row);
    set('comparison', { rows });
  };

  const removeComparisonRow = (i: number) => {
    set('comparison', { rows: (cfg.comparison?.rows || []).filter((_, idx) => idx !== i) });
  };

  const addFaqItem = () => {
    set('faqs', { items: [...(cfg.faqs?.items || []), { question: '', answer: '' }] });
  };

  const updateFaqItem = (i: number, patch: Partial<FaqItem>) => {
    const items = (cfg.faqs?.items || []).map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set('faqs', { items });
  };

  const removeFaqItem = (i: number) => {
    set('faqs', { items: (cfg.faqs?.items || []).filter((_, idx) => idx !== i) });
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
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
        <nav className="flex flex-wrap gap-1 pb-2">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === key ? 'border-purple-500 text-purple-400 bg-neutral-800/40' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
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
            <p className="text-sm font-bold text-foreground">Encabezado principal</p>
            <Field label="Badge / Chip" value={cfg.hero.badge} onChange={v => set('hero', { badge: v })} placeholder="Ej. Plataforma B2B para PYMES" />
            <Field label="Título" value={cfg.hero.title} onChange={v => set('hero', { title: v })} placeholder="Ej. Mucho más que un POS" />
            <Field label="Título destacado (en color)" value={cfg.hero.titleHighlight} onChange={v => set('hero', { titleHighlight: v })} placeholder="Ej. Integral para tu Empresa" />
            <Field label="Descripción" value={cfg.hero.description} onChange={v => set('hero', { description: v })} multiline placeholder="Descripción breve del producto..." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Botón primario" value={cfg.hero.ctaPrimary} onChange={v => set('hero', { ctaPrimary: v })} placeholder="Comenzar gratis" />
              <Field label="Botón secundario" value={cfg.hero.ctaSecondary} onChange={v => set('hero', { ctaSecondary: v })} placeholder="Ver Planes" />
            </div>
            <Field label="Banner DTE" value={cfg.hero.dteBanner} onChange={v => set('hero', { dteBanner: v })} placeholder="Texto del banner inferior del hero..." />
            <div className="pt-4 border-t border-neutral-700">
              <MediaUploadField label="Imagen/Video Principal (Dashboard)" value={cfg.hero.image || ''} onChange={v => set('hero', { image: v })} />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pain */}
      {activeTab === 'pain' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Sección de Puntos de Dolor (El Dolor)</p>
            <Field label="Subtítulo de sección" value={cfg.pain?.subtitle || ''} onChange={v => set('pain', { subtitle: v })} />
            <Field label="Título de sección" value={cfg.pain?.title || ''} onChange={v => set('pain', { title: v })} />
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Dolores / Fricciones ({(cfg.pain?.items || []).length})</p>
              <button
                onClick={addPainItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} />Añadir
              </button>
            </div>
            <div className="space-y-3">
              {(cfg.pain?.items || []).length === 0 ? (
                <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                  Sin dolores. Haz clic en "Añadir" para agregar.
                </div>
              ) : (cfg.pain?.items || []).map((item, i) => (
                <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Dolor {i + 1}</span>
                    <button onClick={() => removePainItem(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Field label="Título" value={item.title} onChange={v => updatePainItem(i, { title: v })} placeholder="Ej. Inventarios Descuadrados" />
                  <Field label="Descripción" value={item.description} onChange={v => updatePainItem(i, { description: v })} multiline placeholder="Descripción del problema..." />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Solution */}
      {activeTab === 'solution' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Sección de Solución (NexoPOS al rescate)</p>
          <Field label="Subtítulo de sección" value={cfg.solution?.subtitle || ''} onChange={v => set('solution', { subtitle: v })} />
          <Field label="Título de sección" value={cfg.solution?.title || ''} onChange={v => set('solution', { title: v })} />
          <Field label="Descripción principal" value={cfg.solution?.description || ''} onChange={v => set('solution', { description: v })} multiline />
          <div className="pt-4 border-t border-neutral-700">
            <MediaUploadField label="Imagen/Video Descriptivo" value={cfg.solution.image || ''} onChange={v => set('solution', { image: v })} />
          </div>
        </div>
      )}

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Encabezado de la sección</p>
            <Field label="Título de sección" value={cfg.features.sectionTitle} onChange={v => set('features', { sectionTitle: v })} />
            <Field label="Subtítulo de sección" value={cfg.features.sectionSubtitle} onChange={v => set('features', { sectionSubtitle: v })} multiline />
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Características ({(cfg.features?.items || []).length})</p>
              <button
                onClick={addFeatureItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} />Añadir
              </button>
            </div>
            <div className="space-y-3">
              {(cfg.features?.items || []).length === 0 ? (
                <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                  Sin características. Haz clic en "Añadir" para agregar.
                </div>
              ) : (cfg.features?.items || []).map((item, i) => (
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

      {/* Tab: Use Cases */}
      {activeTab === 'useCases' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Sección de Casos de Uso (Sectores)</p>
            <Field label="Subtítulo de sección" value={cfg.useCases?.subtitle || ''} onChange={v => set('useCases', { subtitle: v })} />
            <Field label="Título de sección" value={cfg.useCases?.title || ''} onChange={v => set('useCases', { title: v })} />
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Casos de Uso ({(cfg.useCases?.items || []).length})</p>
              <button
                onClick={addUseCaseItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} />Añadir
              </button>
            </div>
            <div className="space-y-3">
              {(cfg.useCases?.items || []).length === 0 ? (
                <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                  Sin casos de uso. Haz clic en "Añadir" para agregar.
                </div>
              ) : (cfg.useCases?.items || []).map((item, i) => (
                <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Caso de Uso {i + 1}</span>
                    <button onClick={() => removeUseCaseItem(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Field label="Sector / Tipo de Comercio" value={item.title} onChange={v => updateUseCaseItem(i, { title: v })} placeholder="Ej. Minimarkets y Almacenes" />
                  <Field label="Descripción del Caso" value={item.description} onChange={v => updateUseCaseItem(i, { description: v })} multiline placeholder="Descripción detallada de cómo NexoPOS le ayuda..." />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-foreground">Métricas y Cifras de Éxito</p>
              <p className="text-xs text-neutral-500">Métricas clave expuestas como prueba social.</p>
            </div>
            <button
              onClick={addStatItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
            >
              <Plus size={13} />Añadir
            </button>
          </div>
          <div className="space-y-3">
            {(cfg.stats?.items || []).length === 0 ? (
              <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                Sin métricas. Haz clic en "Añadir" para agregar.
              </div>
            ) : (cfg.stats?.items || []).map((item, i) => (
              <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Métrica {i + 1}</span>
                  <button onClick={() => removeStatItem(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor" value={item.value} onChange={v => updateStatItem(i, { value: v })} placeholder="Ej. +350 o 99.98%" />
                  <Field label="Etiqueta / Descripción" value={item.label} onChange={v => updateStatItem(i, { label: v })} placeholder="Ej. Empresas Activas" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Testimonials */}
      {activeTab === 'testimonials' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-foreground">Testimonios de Clientes</p>
              <p className="text-xs text-neutral-500">Comentarios y pruebas de satisfacción.</p>
            </div>
            <button
              onClick={addTestimonialItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
            >
              <Plus size={13} />Añadir
            </button>
          </div>
          <div className="space-y-3">
            {(cfg.testimonials?.items || []).length === 0 ? (
              <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                Sin testimonios. Haz clic en "Añadir" para agregar.
              </div>
            ) : (cfg.testimonials?.items || []).map((item, i) => (
              <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Testimonio {i + 1}</span>
                  <button onClick={() => removeTestimonialItem(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <Field label="Nombre del Cliente" value={item.name} onChange={v => updateTestimonialItem(i, { name: v })} placeholder="Ej. Francisco Pérez" />
                <Field label="Cargo / Empresa" value={item.role} onChange={v => updateTestimonialItem(i, { role: v })} placeholder="Ej. Fundador de Almacén Providencia" />
                <Field label="Contenido del testimonio" value={item.content} onChange={v => updateTestimonialItem(i, { content: v })} multiline placeholder="El comentario..." />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Tabla Comparativa (NexoPOS vs Otros)</p>
            <Field label="Subtítulo de sección" value={cfg.comparison?.subtitle || ''} onChange={v => set('comparison', { subtitle: v })} />
            <Field label="Título de sección" value={cfg.comparison?.title || ''} onChange={v => set('comparison', { title: v })} />
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Filas de la Tabla ({(cfg.comparison?.rows || []).length})</p>
              <button
                onClick={addComparisonRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} />Añadir
              </button>
            </div>
            <div className="space-y-3">
              {(cfg.comparison?.rows || []).length === 0 ? (
                <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                  Sin filas comparativas. Haz clic en "Añadir" para agregar.
                </div>
              ) : (cfg.comparison?.rows || []).map((row, i) => (
                <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Fila {i + 1}</span>
                    <button onClick={() => removeComparisonRow(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Field label="Característica / Funcionalidad" value={row.feature} onChange={v => updateComparisonRow(i, { feature: v })} placeholder="Ej. Sincronización en la nube" />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="NexoPOS" value={row.nexopos} onChange={v => updateComparisonRow(i, { nexopos: v })} placeholder="Ej. Sí, 100% Tiempo Real" />
                    <Field label="Excel / Planillas" value={row.excel} onChange={v => updateComparisonRow(i, { excel: v })} placeholder="Ej. No" />
                    <Field label="Tradicionales" value={row.traditional} onChange={v => updateComparisonRow(i, { traditional: v })} placeholder="Ej. A veces" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pricing */}
      {activeTab === 'pricing' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Sección de precios</p>
          <p className="text-xs text-neutral-500">Los planes se muestran automáticamente desde la configuración de planes.</p>
          <Field label="Título" value={cfg.pricing.title} onChange={v => set('pricing', { title: v })} />
          <Field label="Subtítulo" value={cfg.pricing.subtitle} onChange={v => set('pricing', { subtitle: v })} multiline />
        </div>
      )}

      {/* Tab: FAQs */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Preguntas Frecuentes (FAQs)</p>
            <Field label="Subtítulo de sección" value={cfg.faqs?.subtitle || ''} onChange={v => set('faqs', { subtitle: v })} />
            <Field label="Título de sección" value={cfg.faqs?.title || ''} onChange={v => set('faqs', { title: v })} />
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Preguntas ({(cfg.faqs?.items || []).length})</p>
              <button
                onClick={addFaqItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} />Añadir
              </button>
            </div>
            <div className="space-y-3">
              {(cfg.faqs?.items || []).length === 0 ? (
                <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-700 rounded-xl">
                  Sin preguntas. Haz clic en "Añadir" para agregar.
                </div>
              ) : (cfg.faqs?.items || []).map((item, i) => (
                <div key={i} className="border border-neutral-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Pregunta {i + 1}</span>
                    <button onClick={() => removeFaqItem(i)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Field label="Pregunta" value={item.question} onChange={v => updateFaqItem(i, { question: v })} placeholder="¿Cómo funciona...?" />
                  <Field label="Respuesta" value={item.answer} onChange={v => updateFaqItem(i, { answer: v })} multiline placeholder="La respuesta detallada..." />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: CTA */}
      {activeTab === 'cta' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Llamada a la acción (Call to Action)</p>
          <Field label="Título" value={cfg.cta.title} onChange={v => set('cta', { title: v })} />
          <Field label="Subtítulo" value={cfg.cta.subtitle} onChange={v => set('cta', { subtitle: v })} multiline />
          <Field label="Texto del botón" value={cfg.cta.button} onChange={v => set('cta', { button: v })} placeholder="Comenzar 15 Días Gratis" />
        </div>
      )}

      {/* Tab: Footer */}
      {activeTab === 'footer' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Pie de página</p>
          <Field label="Descripción del footer" value={cfg.footer.description} onChange={v => set('footer', { description: v })} multiline />
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Metadatos de Buscadores (SEO)</p>
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
              <p className="text-sm font-bold text-foreground">Asistente Inteligente Público</p>
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
