import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
    Store, Palette, LayoutGrid, Globe, ChevronUp, ChevronDown,
    Plus, Trash2, Star, Search, Copy, ExternalLink, Save,
    AlertCircle, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useProducts } from '../../hooks/useProducts';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'apariencia' | 'catalogo' | 'seo';

interface Slider {
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
}

interface StoreConfig {
    storeSlug: string;
    isActive: boolean;
    whatsappNumber: string;
    brandColor: string;
    bannerUrl: string;
    logoUrl: string;
    announcementEnabled: boolean;
    announcementText: string;
    announcementColor: string;
    sliders: Slider[];
    featuredProductIds: string[];
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    ogImageUrl: string;
}

const DEFAULT_CONFIG: StoreConfig = {
    storeSlug: '',
    isActive: false,
    whatsappNumber: '',
    brandColor: '#3B82F6',
    bannerUrl: '',
    logoUrl: '',
    announcementEnabled: false,
    announcementText: '',
    announcementColor: '#10b981',
    sliders: [],
    featuredProductIds: [],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImageUrl: '',
};

const formatCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;

// ── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
    </button>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

const Input = ({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
    />
);

// ── Tab: General ─────────────────────────────────────────────────────────────

const GeneralTab = ({ cfg, onChange, storeLink, onCopyLink }: {
    cfg: StoreConfig;
    onChange: (p: Partial<StoreConfig>) => void;
    storeLink: string;
    onCopyLink: () => void;
}) => (
    <div className="space-y-6">
        {/* Active */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
                <p className="text-sm font-semibold text-gray-800">Tienda activa</p>
                <p className="text-xs text-gray-500 mt-0.5">Cuando está activa los clientes pueden visitarla</p>
            </div>
            <Toggle value={cfg.isActive} onChange={v => onChange({ isActive: v })} />
        </div>

        {/* Slug */}
        <Field label="URL de tu tienda">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-colors">
                <span className="flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">
                    nexopos.cl/store/
                </span>
                <input
                    type="text"
                    value={cfg.storeSlug}
                    onChange={e => onChange({ storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    placeholder="mi-negocio"
                />
            </div>
            {storeLink && (
                <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-gray-400 truncate flex-1">{storeLink}</span>
                    <button type="button" onClick={onCopyLink} className="text-xs text-indigo-600 font-semibold hover:underline flex-shrink-0">Copiar</button>
                    <a href={storeLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-semibold hover:underline flex-shrink-0">Abrir →</a>
                </div>
            )}
        </Field>

        {/* WhatsApp */}
        <Field label="WhatsApp para pedidos" hint="Sin símbolos, solo números (ej: 56912345678)">
            <Input
                value={cfg.whatsappNumber}
                onChange={v => onChange({ whatsappNumber: v.replace(/\D/g, '') })}
                placeholder="56912345678"
            />
        </Field>

        {/* Logo */}
        <Field label="URL del logo (opcional)">
            <Input value={cfg.logoUrl} onChange={v => onChange({ logoUrl: v })} placeholder="https://..." />
            {cfg.logoUrl && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                    <img src={cfg.logoUrl} alt="Logo" className="h-10 object-contain" />
                </div>
            )}
        </Field>
    </div>
);

// ── Tab: Apariencia ──────────────────────────────────────────────────────────

const AparienciaTab = ({ cfg, onChange }: { cfg: StoreConfig; onChange: (p: Partial<StoreConfig>) => void }) => {
    const addSlider = () => onChange({
        sliders: [...cfg.sliders, {
            id: Date.now().toString(),
            imageUrl: '',
            title: '',
            subtitle: '',
            buttonText: 'Ver más',
            buttonLink: '',
        }],
    });

    const updateSlider = (id: string, patch: Partial<Slider>) =>
        onChange({ sliders: cfg.sliders.map(s => s.id === id ? { ...s, ...patch } : s) });

    const removeSlider = (id: string) =>
        onChange({ sliders: cfg.sliders.filter(s => s.id !== id) });

    const moveSlider = (id: string, dir: 'up' | 'down') => {
        const idx = cfg.sliders.findIndex(s => s.id === id);
        if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === cfg.sliders.length - 1)) return;
        const arr = [...cfg.sliders];
        const swap = dir === 'up' ? idx - 1 : idx + 1;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        onChange({ sliders: arr });
    };

    return (
        <div className="space-y-8">
            {/* Brand color */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Color de marca</label>
                <div className="flex items-center gap-4">
                    <input
                        type="color"
                        value={cfg.brandColor}
                        onChange={e => onChange({ brandColor: e.target.value })}
                        className="w-16 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                    />
                    <div
                        className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                        style={{ backgroundColor: cfg.brandColor }}
                    >
                        Vista previa del botón
                    </div>
                </div>
            </div>

            {/* Banner */}
            <Field label="Banner principal (URL de imagen)">
                <Input value={cfg.bannerUrl} onChange={v => onChange({ bannerUrl: v })} placeholder="https://..." />
                {cfg.bannerUrl && (
                    <img src={cfg.bannerUrl} alt="Banner" className="mt-2 w-full h-32 object-cover rounded-xl border border-gray-100" />
                )}
            </Field>

            {/* Announcement bar */}
            <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Barra de anuncio</p>
                        <p className="text-xs text-gray-400 mt-0.5">Mensaje destacado en la parte superior de la tienda</p>
                    </div>
                    <Toggle value={cfg.announcementEnabled} onChange={v => onChange({ announcementEnabled: v })} />
                </div>
                {cfg.announcementEnabled && (
                    <div className="space-y-3">
                        <Input
                            value={cfg.announcementText}
                            onChange={v => onChange({ announcementText: v })}
                            placeholder="¡Envío gratis en compras sobre $50.000!"
                        />
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 font-medium flex-shrink-0">Color:</span>
                            <input
                                type="color"
                                value={cfg.announcementColor}
                                onChange={e => onChange({ announcementColor: e.target.value })}
                                className="h-8 w-14 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                            />
                            {cfg.announcementText && (
                                <div
                                    className="flex-1 text-xs px-3 py-1.5 rounded-lg text-white text-center font-medium"
                                    style={{ backgroundColor: cfg.announcementColor }}
                                >
                                    {cfg.announcementText}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sliders */}
            <div>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Slides promocionales</p>
                        <p className="text-xs text-gray-400 mt-0.5">Carrusel de imágenes al inicio de la tienda</p>
                    </div>
                    <button
                        type="button"
                        onClick={addSlider}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar slide
                    </button>
                </div>

                <div className="space-y-3">
                    {cfg.sliders.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400">
                            Sin slides — presiona "Agregar slide" para crear uno
                        </div>
                    )}
                    {cfg.sliders.map((slide, idx) => (
                        <div key={slide.id} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Slide {idx + 1}</span>
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => moveSlider(slide.id, 'up')} disabled={idx === 0}
                                        className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => moveSlider(slide.id, 'down')} disabled={idx === cfg.sliders.length - 1}
                                        className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => removeSlider(slide.id)}
                                        className="p-1.5 text-red-300 hover:text-red-600 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={slide.imageUrl}
                                onChange={e => updateSlider(slide.id, { imageUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
                                placeholder="URL de imagen (https://...)"
                            />
                            {slide.imageUrl && (
                                <img src={slide.imageUrl} alt="" className="w-full h-28 object-cover rounded-xl" />
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'title', ph: 'Título del slide' },
                                    { key: 'subtitle', ph: 'Subtítulo' },
                                    { key: 'buttonText', ph: 'Texto del botón' },
                                    { key: 'buttonLink', ph: 'Link del botón (https://...)' },
                                ].map(({ key, ph }) => (
                                    <input
                                        key={key}
                                        type="text"
                                        value={(slide as any)[key]}
                                        onChange={e => updateSlider(slide.id, { [key]: e.target.value })}
                                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
                                        placeholder={ph}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Tab: Catálogo ────────────────────────────────────────────────────────────

const CatalogoTab = ({ cfg, onChange, products, tenantId }: {
    cfg: StoreConfig;
    onChange: (p: Partial<StoreConfig>) => void;
    products: any[];
    tenantId?: string;
}) => {
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'all' | 'featured'>('all');
    const [localProducts, setLocalProducts] = useState<any[]>(products);

    useEffect(() => setLocalProducts(products), [products]);

    const toggleFeatured = (id: string) => {
        const next = cfg.featuredProductIds.includes(id)
            ? cfg.featuredProductIds.filter(x => x !== id)
            : [...cfg.featuredProductIds, id];
        onChange({ featuredProductIds: next });
    };

    const togglePublic = async (id: string, current: boolean) => {
        const next = !current;
        setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, isPublic: next } : p));
        try {
            await api.patch('/products/bulk-public', { ids: [id], isPublic: next }, {
                params: { tenantId },
            });
            toast.success(next ? 'Producto publicado en tienda' : 'Producto ocultado de tienda');
        } catch {
            setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, isPublic: current } : p));
            toast.error('Error al actualizar');
        }
    };

    const bulkPublic = async (makePublic: boolean) => {
        const ids = localProducts.map(p => p.id);
        if (!ids.length) return;
        if (!confirm(`¿${makePublic ? 'Publicar' : 'Ocultar'} los ${ids.length} productos en la tienda?`)) return;
        setLocalProducts(prev => prev.map(p => ({ ...p, isPublic: makePublic })));
        try {
            await api.patch('/products/bulk-public', { ids, isPublic: makePublic }, { params: { tenantId } });
            toast.success(`Productos ${makePublic ? 'publicados' : 'ocultados'} correctamente`);
        } catch {
            toast.error('Error al actualizar masivamente');
        }
    };

    const filtered = localProducts.filter(p => {
        const q = p.name.toLowerCase().includes(search.toLowerCase());
        return view === 'featured' ? q && cfg.featuredProductIds.includes(p.id) : q;
    });

    return (
        <div className="space-y-5">
            {/* Featured summary */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" />
                <p className="text-sm text-amber-700">
                    <span className="font-bold">{cfg.featuredProductIds.length}</span> producto{cfg.featuredProductIds.length !== 1 ? 's' : ''} destacado{cfg.featuredProductIds.length !== 1 ? 's' : ''} — aparecen en una sección especial al inicio de la tienda
                </p>
            </div>

            {/* Controls */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar productos..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
                    />
                </div>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    {(['all', 'featured'] as const).map(v => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={`px-3 py-2 text-xs font-semibold transition-colors border-r border-gray-200 last:border-0 ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {v === 'all' ? 'Todos' : 'Destacados'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => bulkPublic(true)}
                        className="px-3 py-2 text-xs font-semibold bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                        Publicar todo
                    </button>
                    <button type="button" onClick={() => bulkPublic(false)}
                        className="px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                        Ocultar todo
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide w-10">
                                <Star className="w-3.5 h-3.5" />
                            </th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Producto</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Precio</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">Visible</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(p => {
                            const isFeatured = cfg.featuredProductIds.includes(p.id);
                            return (
                                <tr key={p.id} className={`transition-colors hover:bg-gray-50 ${isFeatured ? 'bg-amber-50/40' : ''}`}>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleFeatured(p.id)}
                                            title={isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                                            className={`transition-colors ${isFeatured ? 'text-amber-500 hover:text-amber-700' : 'text-gray-200 hover:text-amber-400'}`}
                                        >
                                            <Star className="w-4 h-4" fill={isFeatured ? 'currentColor' : 'none'} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                                            <span className="font-medium text-gray-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatCLP(p.price)}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{p.category?.name || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => togglePublic(p.id, !!p.isPublic)}
                                                title={p.isPublic ? 'Ocultar de tienda' : 'Publicar en tienda'}
                                                className={`text-gray-400 hover:text-gray-600 transition-colors`}
                                            >
                                                {p.isPublic
                                                    ? <Eye className="w-4 h-4 text-indigo-500" />
                                                    : <EyeOff className="w-4 h-4 text-gray-300" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                                    {view === 'featured' ? 'No hay productos destacados aún — haz clic en ⭐ para destacar' : 'No se encontraron productos'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── Tab: SEO ─────────────────────────────────────────────────────────────────

const SeoTab = ({ cfg, onChange, storeName }: {
    cfg: StoreConfig;
    onChange: (p: Partial<StoreConfig>) => void;
    storeName: string;
}) => (
    <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-600">
                Optimiza cómo aparece tu tienda en Google y al compartir en redes sociales
            </p>
        </div>

        {/* SEO Title */}
        <div>
            <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Título SEO</label>
                <span className={`text-xs font-medium ${cfg.seoTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                    {cfg.seoTitle.length}/60
                </span>
            </div>
            <Input
                value={cfg.seoTitle}
                onChange={v => onChange({ seoTitle: v })}
                placeholder={`${storeName || 'Mi Tienda'} — Tienda Online en Chile`}
            />
        </div>

        {/* SEO Description */}
        <div>
            <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Descripción SEO</label>
                <span className={`text-xs font-medium ${cfg.seoDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {cfg.seoDescription.length}/160
                </span>
            </div>
            <textarea
                value={cfg.seoDescription}
                onChange={e => onChange({ seoDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                placeholder="Compra en nuestra tienda online. Amplio catálogo con los mejores precios."
            />
        </div>

        {/* Keywords */}
        <Field label="Palabras clave" hint="Separadas por coma">
            <Input
                value={cfg.seoKeywords}
                onChange={v => onChange({ seoKeywords: v })}
                placeholder="tienda online, productos, ofertas, Chile"
            />
        </Field>

        {/* OG Image */}
        <Field label="Imagen para redes sociales" hint="Tamaño recomendado: 1200 × 630 px">
            <Input value={cfg.ogImageUrl} onChange={v => onChange({ ogImageUrl: v })} placeholder="https://..." />
            {cfg.ogImageUrl && (
                <img src={cfg.ogImageUrl} alt="OG preview" className="mt-2 w-full h-32 object-cover rounded-xl border" />
            )}
        </Field>

        {/* SERP Preview */}
        {(cfg.seoTitle || cfg.seoDescription) && (
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Vista previa en Google</p>
                <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
                    <p className="text-[#1a0dab] text-lg font-medium leading-snug cursor-pointer hover:underline">
                        {cfg.seoTitle || `${storeName} — Tienda Online`}
                    </p>
                    <p className="text-[#006621] text-sm mt-0.5">nexopos.cl/store/{cfg.storeSlug || '...'}</p>
                    <p className="text-[#545454] text-sm mt-1.5 leading-relaxed">
                        {cfg.seoDescription || 'Descripción de tu tienda online...'}
                    </p>
                </div>
            </div>
        )}
    </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

export const EcommercePage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [cfg, setCfg] = useState<StoreConfig>(DEFAULT_CONFIG);
    const [storeName, setStoreName] = useState('');
    const [storeLink, setStoreLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { data: products = [], isLoading: productsLoading } = useProducts(user?.tenantId);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/store/settings');
                const ss = (data.storeSettings as any) || {};
                setStoreName(data.name || '');
                setCfg({
                    storeSlug: data.storeSlug || '',
                    isActive: ss.isActive || false,
                    whatsappNumber: ss.whatsappNumber || '',
                    brandColor: ss.brandColor || '#3B82F6',
                    bannerUrl: ss.bannerUrl || '',
                    logoUrl: ss.logoUrl || '',
                    announcementEnabled: ss.announcementEnabled || false,
                    announcementText: ss.announcementText || '',
                    announcementColor: ss.announcementColor || '#10b981',
                    sliders: ss.sliders || [],
                    featuredProductIds: ss.featuredProductIds || [],
                    seoTitle: ss.seoTitle || '',
                    seoDescription: ss.seoDescription || '',
                    seoKeywords: ss.seoKeywords || '',
                    ogImageUrl: ss.ogImageUrl || '',
                });
                if (data.storeSlug) setStoreLink(`${window.location.origin}/store/${data.storeSlug}`);
            } catch {
                toast.error('Error al cargar la configuración');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = useCallback((patch: Partial<StoreConfig>) => {
        setCfg(prev => ({ ...prev, ...patch }));
    }, []);

    const handleSave = async () => {
        if (!cfg.storeSlug.trim()) {
            toast.error('El slug de la tienda es obligatorio');
            setActiveTab('general');
            return;
        }
        setSaving(true);
        try {
            const { storeSlug, ...rest } = cfg;
            await api.patch('/store/settings', { storeSlug, storeSettings: rest });
            toast.success('Configuración guardada correctamente');
            if (storeSlug) setStoreLink(`${window.location.origin}/store/${storeSlug}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(storeLink);
        toast.success('Enlace copiado al portapapeles');
    };

    const TABS: { id: Tab; label: string; Icon: any }[] = [
        { id: 'general', label: 'General', Icon: Store },
        { id: 'apariencia', label: 'Apariencia', Icon: Palette },
        { id: 'catalogo', label: 'Catálogo', Icon: LayoutGrid },
        { id: 'seo', label: 'SEO', Icon: Globe },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between mb-5 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mi Tienda Online</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Configura, personaliza y gestiona tu e-commerce</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {storeLink && (
                            <>
                                <a href={storeLink} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Ver tienda</span>
                                </a>
                                <button onClick={copyLink}
                                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Copiar</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>

                {/* Status banner */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-5 text-sm font-medium ${cfg.isActive
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                    {cfg.isActive
                        ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Tu tienda está activa {storeLink && <a href={storeLink} target="_blank" rel="noreferrer" className="underline ml-1 truncate">{storeLink}</a>}</>
                        : <><AlertCircle className="w-4 h-4 flex-shrink-0" /> Tu tienda está inactiva — actívala en la pestaña General</>
                    }
                </div>

                {/* Panel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100">
                        {TABS.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 -mb-px flex-1 justify-center ${activeTab === id
                                    ? 'text-indigo-600 border-indigo-600 bg-indigo-50/40'
                                    : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                                Cargando configuración...
                            </div>
                        ) : (
                            <>
                                {activeTab === 'general' && (
                                    <GeneralTab cfg={cfg} onChange={handleChange} storeLink={storeLink} onCopyLink={copyLink} />
                                )}
                                {activeTab === 'apariencia' && (
                                    <AparienciaTab cfg={cfg} onChange={handleChange} />
                                )}
                                {activeTab === 'catalogo' && (
                                    <CatalogoTab
                                        cfg={cfg}
                                        onChange={handleChange}
                                        products={productsLoading ? [] : (products as any[])}
                                        tenantId={user?.tenantId}
                                    />
                                )}
                                {activeTab === 'seo' && (
                                    <SeoTab cfg={cfg} onChange={handleChange} storeName={storeName} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
