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
        badge: 'Software POS · +350 Comercios en Chile · Operando desde 2022',
        title: 'Tu comercio no puede funcionar a ciegas.',
        titleHighlight: 'NexoPOS te devuelve el control total, en tiempo real.',
        description: 'El sistema POS más rápido de Chile. Stock sincronizado al instante, caja sin filas y tu operación completa en un solo panel — desde cualquier dispositivo.',
        ctaPrimary: 'Solicitar Demo Gratuita',
        ctaSecondary: 'Ver el sistema en acción',
        dteBanner: 'Incluye Facturación Electrónica DTE certificada ante el SII, sin costo extra.',
    },
    pain: {
        title: 'Si ya viviste esto, sabes exactamente de lo que hablamos.',
        subtitle: 'EL CAOS QUE QUEMA TU NEGOCIO POR DENTRO',
        items: [
            {
                title: 'La caja que no cuadra nunca',
                description: 'Tu cajero anota las ventas a mano o en una planilla que nadie actualiza al mismo tiempo. Al final del día, los números no cierran — y nunca sabrás si fue un error humano, una venta mal registrada o robo hormiga. Revisas todo de nuevo. Son las 10 de la noche. Sigues en el local.'
            },
            {
                title: 'Vendes lo que no tienes. Pierdes lo que no ves.',
                description: 'Un cliente pide el producto que más te rota. Tú dices que hay stock. Vas a buscarlo a la bodega y no está. ¿Fue vendido sin registrarse? ¿Quedó mal ingresado? No tienes cómo saberlo. El cliente se va. La reputación se daña. El margen se evapora.'
            },
            {
                title: 'Filas que matan ventas y sucursales que operan como islas',
                description: 'Cada segundo de espera en la caja es un cliente que recalcula si vale la pena. Un sistema lento no solo molesta — te cuesta ventas reales. Y lo que pasa en una sucursal no llega a la otra ni al dueño. Descubres los problemas días después, cuando ya no hay solución.'
            }
        ]
    },
    solution: {
        title: 'Un sistema tan rápido como tu comercio. Tan preciso como necesitas.',
        subtitle: 'NEXOPOS — CONTROL TOTAL. SIN CONCESIONES.',
        description: 'NexoPOS fue construido sobre una premisa simple: cada décima de segundo que ahorras en la caja y cada unidad que tu inventario registra correctamente, es dinero que vuelve a tu bolsillo. Una sola plataforma. Un solo dashboard. Cero doble digitación.'
    },
    features: {
        sectionTitle: 'Tres módulos que transforman la forma en que operas.',
        sectionSubtitle: 'Cada funcionalidad fue diseñada para eliminar una fricción específica en el comercio chileno moderno.',
        items: [
            {
                title: '⚡ Caja Hiper-Rápida. Menos de 2 segundos por transacción.',
                description: 'Busca el producto por código de barra, nombre o categoría en milisegundos. El sistema calcula cambios, descuentos y propinas automáticamente. Múltiples métodos de pago en un clic. Funciona offline si cae el internet. Compatible con impresoras térmicas 57mm y 80mm, lectores de barra y gavetas electrónicas.'
            },
            {
                title: '📦 Stock Sincronizado al Instante. En Todos Tus Locales.',
                description: 'Cada vez que un producto sale por la caja — ya sea en tu local físico, tu tienda online o una sucursal a 200 km — el inventario se actualiza en milisegundos en toda la red. Alertas automáticas de stock mínimo. Transferencias entre bodegas con trazabilidad completa. Dashboard en tiempo real desde el celular.'
            },
            {
                title: '🏪 Control Multisucursal. Todo desde un Solo Panel.',
                description: 'Administra múltiples locales sin moverte de tu casa. Visualiza el stock de cada bodega en tiempo real, inspecciona reportes consolidados por sede y detecta descuadres antes de que se conviertan en pérdidas. El control que antes requería presencia física, ahora está en tu pantalla.'
            },
            {
                title: '🌐 Tu Tienda Online Sincronizada con tu Local.',
                description: 'Tu catálogo físico y online comparten el mismo inventario en tiempo real. Si vendes en el local, el stock web baja al instante. Si vendes online, el POS ya sabe que ese producto no está disponible. Sin quiebres de stock. Sin ventas de productos inexistentes. Sin clientes enojados.'
            },
        ],
    },
    useCases: {
        title: 'Diseñado para el comercio real en Chile.',
        subtitle: 'SECTORES COMPATIBLES',
        items: [
            { title: 'Minimarkets y Almacenes', description: 'Lectura ultra rápida de código de barras, control de vencimientos y cierre de caja automatizado. Para el negocio que no puede perder ni un segundo.' },
            { title: 'Ferreterías y Repuestos', description: 'Gestión de miles de SKUs, equivalencias de productos y ventas mayoristas. Tus vendedores encuentran el repuesto correcto en segundos, no en minutos.' },
            { title: 'Tiendas de Retail y Mascotas', description: 'Variantes de productos (talla, color, sabor), control de servicios y promociones dinámicas. Cada producto en su lugar, cada precio correcto.' },
            { title: 'Distribuidoras y Mayoristas', description: 'Módulo de compras robusto, márgenes de ganancia por volumen y control de rutas. Tu bodega siempre abastecida y tus márgenes siempre visibles.' }
        ]
    },
    stats: {
        items: [
            { label: 'Comercios Activos en Chile', value: '+350' },
            { label: 'Transacciones Procesadas', value: '+15 Millones' },
            { label: 'Uptime Garantizado (AWS)', value: '99.98%' }
        ]
    },
    testimonials: {
        items: [
            {
                name: 'Francisco Pérez',
                role: 'Fundador · Almacén Providencia',
                content: 'Antes del fin de semana lo pasábamos cuadrando inventarios a mano entre todos los locales. Era insostenible. Con NexoPOS eso desapareció — el sistema actualiza el stock solo, en tiempo real, y yo lo veo desde el celular mientras estoy en casa. Abrimos 3 sucursales en 12 meses.'
            },
            {
                name: 'Alejandra Fravéga',
                role: 'Gerente de Operaciones · Distribuidora Ponchos del Cachapoal',
                content: 'La velocidad de caja es brutal. Antes hacíamos fila en los momentos peak. Ahora cobramos el doble de rápido y los clientes lo notan. NexoPOS cambió la experiencia de compra de nuestra tienda completamente.'
            }
        ]
    },
    comparison: {
        title: 'NexoPOS vs. Excel y sistemas del pasado',
        subtitle: 'COMPARATIVA OBJETIVA',
        rows: [
            { feature: 'Sincronización de stock en tiempo real', nexopos: 'Sí, 100% instantáneo', excel: 'No (archivos locales aislados)', traditional: 'A veces (servidores lentos)' },
            { feature: 'Velocidad de caja por transacción', nexopos: 'Menos de 2 segundos', excel: 'Lento e ineficiente', traditional: 'Lento, requiere terminales caras' },
            { feature: 'Alertas de stock mínimo automáticas', nexopos: 'Sí, configurables por producto', excel: 'No (revisión manual)', traditional: 'Requiere módulo extra de pago' },
            { feature: 'Soporte técnico en vivo', nexopos: 'WhatsApp directo — respuesta en 15 min', excel: 'Tú lo resuelves solo', traditional: 'Soporte telefónico costoso o ausente' },
            { feature: 'Control multisucursal unificado', nexopos: 'Sí, desde un solo panel', excel: 'No', traditional: 'Requiere instalación en cada local' }
        ]
    },
    pricing: {
        title: 'Planes escalables. Sin contratos. Sin sorpresas.',
        subtitle: 'Elige el plan que soporta tu operación hoy. Escala cuando crezcas. Cancela cuando quieras — sin multas ni costos extras.',
    },
    faqs: {
        title: 'Preguntas frecuentes',
        subtitle: 'Respuestas claras antes de que las necesites.',
        items: [
            { question: '¿El POS funciona si se cae el internet?', answer: 'Sí. El módulo de caja cuenta con modo offline inteligente. Puedes seguir vendiendo y registrando pagos sin conexión. Tan pronto vuelva la señal, los datos se sincronizan automáticamente con la nube sin intervención manual.' },
            { question: '¿Puedo ver el inventario de todas mis sucursales en tiempo real?', answer: 'Sí. Desde el dashboard administrativo puedes ver el stock de cada bodega y sucursal en tiempo real, desde cualquier dispositivo. No necesitas estar físicamente en el local.' },
            { question: '¿Tengo que firmar un contrato de permanencia mínima?', answer: 'No. El servicio se cobra mensualmente y puedes cancelarlo o cambiar de plan en cualquier momento sin multas ni costos de salida.' },
            { question: '¿Puedo importar mis productos desde Excel?', answer: '¡Por supuesto! NexoPOS tiene un importador masivo de productos en Excel. Si tienes dificultades, nuestro equipo de soporte te asiste para migrar toda tu base de datos en menos de 1 hora.' },
            { question: '¿NexoPOS es compatible con lectores de código de barra y gavetas de dinero?', answer: 'Sí, es compatible con el 99% de los hardwares POS USB y Bluetooth del mercado: lectores de código de barra, impresoras térmicas de 57mm y 80mm, y gavetas electrónicas.' },
            { question: '¿Cómo funciona la integración con Shopify y WooCommerce?', answer: 'Conectas tu tienda en un paso con tus credenciales API. Cuando vendes online, el stock baja en el POS de tu local físico. Si vendes en el local, el inventario web se actualiza al instante. Sin doble digitación, sin desfases.' },
            { question: '¿El soporte técnico está incluido en el precio?', answer: 'Sí, todos los planes incluyen soporte técnico. Los planes intermedios y avanzados incluyen canal de WhatsApp prioritario con respuesta garantizada en menos de 15 minutos.' },
            { question: '¿Puedo configurar precios por volumen o precios mayoristas?', answer: 'Sí. NexoPOS te permite configurar escalas de precios por cantidad (precios mayoristas, descuentos por volumen) por cada producto.' },
            { question: '¿Los datos de mi negocio están seguros?', answer: 'Sí. Toda la información viaja encriptada vía SSL y se almacena en servidores AWS de alta disponibilidad con respaldos automatizados cada 6 horas.' },
            { question: '¿Necesito comprar un Certificado Digital para la facturación electrónica?', answer: 'No. NexoPOS incluye la gestión completa de firma digital y folios DTE en el plan. Nos encargamos de enrolar tu empresa ante el SII sin costo adicional.' }
        ]
    },
    cta: {
        title: 'Tu comercio merece un sistema que trabaje tan duro como tú.',
        subtitle: 'Solicita una demo personalizada de 30 minutos. Te mostramos en vivo cómo NexoPOS opera en un comercio como el tuyo — sin términos técnicos, sin presión de venta.',
        button: 'Solicitar Demo Gratuita',
    },
    footer: { description: 'El sistema POS más rápido de Chile. Control total de tu inventario, caja y sucursales en tiempo real.' },
    seo: {
        title: 'NexoPOS | Sistema POS Chile — Control Total de tu Comercio',
        description: 'Software punto de venta líder para PYMES chilenas. Ideal para minimarkets, ferreterías y almacenes. Sincronización de stock en tiempo real y caja ultrarrápida.',
        keywords: 'sistema pos chile, software punto de venta, software para ferreterías, punto de venta minimarket, control inventario tiempo real, sistema ventas pyme chile, software inventario'
    },
    chatbot: {
        enabled: false,
        welcomeMessage: '¡Hola! Soy el asistente de NexoPOS. ¿Tienes alguna pregunta sobre el sistema o quieres agendar una demo gratuita?',
        options: ['Quiero una Demo', 'Ver Planes y Precios', 'Soporte Técnico']
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
