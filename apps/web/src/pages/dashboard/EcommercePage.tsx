import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
    Store, Palette, LayoutGrid, Globe, ChevronUp, ChevronDown,
    Plus, Trash2, Star, Search, Copy, ExternalLink, Save,
    Eye, EyeOff, Upload, X, Loader2,
    ImageIcon,
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
    brandColor: '#6366f1',
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

// ── Primitives ────────────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${value ? 'bg-indigo-500' : 'bg-gray-200'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? 'translate-x-6' : ''}`} />
    </button>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
);

const Input = ({ value, onChange, placeholder, type = 'text' }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
    <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
    />
);

// ── Image Upload Field ────────────────────────────────────────────────────────

const ImageUploadField = ({ value, onChange, label, hint, previewClass = 'h-32' }: {
    value: string;
    onChange: (url: string) => void;
    label: string;
    hint?: string;
    previewClass?: string;
}) => {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            const { data } = await api.post('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onChange(data.url);
            toast.success('Imagen subida correctamente');
        } catch {
            toast.error('Error al subir la imagen');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Field label={label} hint={hint}>
            <div className="space-y-2">
                {value ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                        <img src={value} alt="" className={`w-full ${previewClass} object-cover`} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                    >
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                        <span className="text-sm font-medium text-gray-400">Haz clic para subir imagen</span>
                        <span className="text-xs text-gray-300">JPG, PNG, WebP — máx 5MB</span>
                    </button>
                )}
                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                        {uploading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Upload className="w-3.5 h-3.5" />}
                        {uploading ? 'Subiendo...' : 'Subir'}
                    </button>
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="O pega una URL..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white"
                    />
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
        </Field>
    );
};

// ── Tab: General ──────────────────────────────────────────────────────────────

const GeneralTab = ({ cfg, onChange, storeLink, onCopyLink }: {
    cfg: StoreConfig;
    onChange: (p: Partial<StoreConfig>) => void;
    storeLink: string;
    onCopyLink: () => void;
}) => (
    <div className="space-y-5">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
            <div>
                <p className="text-sm font-bold text-gray-800">Tienda activa</p>
                <p className="text-xs text-gray-500 mt-0.5">Los clientes pueden visitar y comprar</p>
            </div>
            <Toggle value={cfg.isActive} onChange={v => onChange({ isActive: v })} />
        </div>

        <Field label="URL de tu tienda">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
                <span className="flex items-center px-3 bg-gray-50 text-gray-400 text-xs border-r border-gray-200 whitespace-nowrap font-medium">
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
                <div className="mt-2 flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 truncate flex-1">{storeLink}</span>
                    <button type="button" onClick={onCopyLink} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={storeLink} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Abrir">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}
        </Field>

        <Field label="WhatsApp para pedidos" hint="Sin símbolos, solo números (ej: 56912345678)">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📱</span>
                <input
                    type="text"
                    value={cfg.whatsappNumber}
                    onChange={e => onChange({ whatsappNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="56912345678"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                />
            </div>
        </Field>

        <ImageUploadField
            label="Logo de la tienda (opcional)"
            value={cfg.logoUrl}
            onChange={v => onChange({ logoUrl: v })}
            previewClass="h-20 object-contain bg-gray-50"
            hint="Aparece en el header de la tienda"
        />
    </div>
);

// ── Tab: Apariencia ───────────────────────────────────────────────────────────

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

    const handleSliderImage = (id: string) => async (url: string) => {
        updateSlider(id, { imageUrl: url });
    };

    return (
        <div className="space-y-8">
            {/* Brand color */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Color de marca</label>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="color"
                            value={cfg.brandColor}
                            onChange={e => onChange({ brandColor: e.target.value })}
                            className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-1"
                        />
                    </div>
                    <div className="flex-1">
                        <div
                            className="h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                            style={{ backgroundColor: cfg.brandColor }}
                        >
                            Vista previa del botón
                        </div>
                    </div>
                    <input
                        type="text"
                        value={cfg.brandColor}
                        onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange({ brandColor: e.target.value })}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-indigo-400 text-center"
                    />
                </div>
            </div>

            <ImageUploadField
                label="Banner principal"
                value={cfg.bannerUrl}
                onChange={v => onChange({ bannerUrl: v })}
                previewClass="h-36"
                hint="Imagen de cabecera de la tienda (si no hay slides)"
            />

            {/* Announcement bar */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div>
                        <p className="text-sm font-bold text-gray-800">Barra de anuncio</p>
                        <p className="text-xs text-gray-400 mt-0.5">Mensaje destacado en el tope de la tienda</p>
                    </div>
                    <Toggle value={cfg.announcementEnabled} onChange={v => onChange({ announcementEnabled: v })} />
                </div>
                {cfg.announcementEnabled && (
                    <div className="p-4 space-y-3 border-t border-gray-100">
                        <Input
                            value={cfg.announcementText}
                            onChange={v => onChange({ announcementText: v })}
                            placeholder="¡Envío gratis en compras sobre $50.000!"
                        />
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium flex-shrink-0">Color:</span>
                            <input
                                type="color"
                                value={cfg.announcementColor}
                                onChange={e => onChange({ announcementColor: e.target.value })}
                                className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                            />
                            {cfg.announcementText && (
                                <div
                                    className="flex-1 text-xs px-3 py-2 rounded-lg text-white text-center font-semibold"
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
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-bold text-gray-800">Slides promocionales</p>
                        <p className="text-xs text-gray-400 mt-0.5">Carrusel auto-rotante al inicio de la tienda</p>
                    </div>
                    <button
                        type="button"
                        onClick={addSlider}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar slide
                    </button>
                </div>

                <div className="space-y-3">
                    {cfg.sliders.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                            <ImageIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Sin slides — presiona "Agregar slide"</p>
                        </div>
                    )}
                    {cfg.sliders.map((slide, idx) => (
                        <div key={slide.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Slide {idx + 1}</span>
                                <div className="flex items-center gap-0.5">
                                    <button type="button" onClick={() => moveSlider(slide.id, 'up')} disabled={idx === 0}
                                        className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors rounded-lg hover:bg-gray-100">
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => moveSlider(slide.id, 'down')} disabled={idx === cfg.sliders.length - 1}
                                        className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors rounded-lg hover:bg-gray-100">
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => removeSlider(slide.id)}
                                        className="p-1.5 text-red-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <ImageUploadField
                                    label="Imagen del slide"
                                    value={slide.imageUrl}
                                    onChange={handleSliderImage(slide.id)}
                                    previewClass="h-32"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'title', ph: 'Título del slide' },
                                        { key: 'subtitle', ph: 'Subtítulo' },
                                        { key: 'buttonText', ph: 'Texto del botón' },
                                        { key: 'buttonLink', ph: 'Link del botón' },
                                    ].map(({ key, ph }) => (
                                        <input
                                            key={key}
                                            type="text"
                                            value={(slide as any)[key]}
                                            onChange={e => updateSlider(slide.id, { [key]: e.target.value })}
                                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white"
                                            placeholder={ph}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Tab: Catálogo ─────────────────────────────────────────────────────────────

const CatalogoTab = ({ cfg, onChange, products }: {
    cfg: StoreConfig;
    onChange: (p: Partial<StoreConfig>) => void;
    products: any[];
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
            await api.patch('/products/bulk-public', { ids: [id], isPublic: next });
            toast.success(next ? 'Producto visible en tienda' : 'Producto oculto de tienda', {
                style: { borderRadius: '12px', fontSize: '13px' },
            });
        } catch {
            setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, isPublic: current } : p));
            toast.error('Error al actualizar');
        }
    };

    const bulkPublic = async (makePublic: boolean) => {
        const ids = localProducts.map(p => p.id);
        if (!ids.length) return;
        if (!confirm(`¿${makePublic ? 'Publicar' : 'Ocultar'} los ${ids.length} productos?`)) return;
        setLocalProducts(prev => prev.map(p => ({ ...p, isPublic: makePublic })));
        try {
            await api.patch('/products/bulk-public', { ids, isPublic: makePublic });
            toast.success(`${ids.length} productos ${makePublic ? 'publicados' : 'ocultados'}`);
        } catch {
            toast.error('Error al actualizar');
        }
    };

    const filtered = localProducts.filter(p => {
        const q = p.name.toLowerCase().includes(search.toLowerCase());
        return view === 'featured' ? q && cfg.featuredProductIds.includes(p.id) : q;
    });

    const featuredCount = cfg.featuredProductIds.length;
    const publicCount = localProducts.filter(p => p.isPublic).length;

    return (
        <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Star className="w-4 h-4 text-amber-600" fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-amber-700">{featuredCount}</p>
                        <p className="text-xs text-amber-600">Destacados</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <Eye className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-green-700">{publicCount}</p>
                        <p className="text-xs text-green-600">Visibles en tienda</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar productos..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white"
                    />
                </div>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                    {(['all', 'featured'] as const).map(v => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={`px-3 py-2 text-xs font-semibold transition-colors border-r border-gray-200 last:border-0 ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {v === 'all' ? 'Todos' : '⭐ Destacados'}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={() => bulkPublic(true)}
                    className="px-3 py-2 text-xs font-bold bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
                    Publicar todo
                </button>
                <button type="button" onClick={() => bulkPublic(false)}
                    className="px-3 py-2 text-xs font-bold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                    Ocultar todo
                </button>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 w-10 text-center">
                                <Star className="w-3.5 h-3.5 text-gray-300 mx-auto" />
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
                                <tr key={p.id} className={`transition-colors hover:bg-gray-50/80 ${isFeatured ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => toggleFeatured(p.id)}
                                            title={isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                                            className={`transition-all ${isFeatured ? 'text-amber-500 hover:text-amber-700 scale-110' : 'text-gray-200 hover:text-amber-400'}`}
                                        >
                                            <Star className="w-4 h-4" fill={isFeatured ? 'currentColor' : 'none'} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            {p.image
                                                ? <img src={p.image} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                                                : <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                                            }
                                            <span className="font-medium text-gray-900 text-sm leading-snug">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">{formatCLP(p.price)}</td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        {p.category?.name
                                            ? <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.category.name}</span>
                                            : <span className="text-gray-300 text-xs">—</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => togglePublic(p.id, !!p.isPublic)}
                                                title={p.isPublic ? 'Ocultar de tienda' : 'Publicar en tienda'}
                                                className="p-1.5 rounded-lg transition-all hover:scale-110"
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
                                <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                                    {view === 'featured'
                                        ? 'No hay productos destacados — haz clic en ⭐ para destacar'
                                        : 'No se encontraron productos'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── Tab: SEO ──────────────────────────────────────────────────────────────────

const SeoTab = ({ cfg, onChange, storeName }: {
    cfg: StoreConfig;
    onChange: (p: Partial<StoreConfig>) => void;
    storeName: string;
}) => (
    <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
                Controla cómo aparece tu tienda en Google y al compartir en redes sociales
            </p>
        </div>

        <div>
            <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Título SEO</label>
                <span className={`text-xs font-bold tabular-nums ${cfg.seoTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                    {cfg.seoTitle.length}/60
                </span>
            </div>
            <Input
                value={cfg.seoTitle}
                onChange={v => onChange({ seoTitle: v })}
                placeholder={`${storeName || 'Mi Tienda'} — Tienda Online en Chile`}
            />
        </div>

        <div>
            <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Descripción SEO</label>
                <span className={`text-xs font-bold tabular-nums ${cfg.seoDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {cfg.seoDescription.length}/160
                </span>
            </div>
            <textarea
                value={cfg.seoDescription}
                onChange={e => onChange({ seoDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none bg-white"
                placeholder="Compra en nuestra tienda online. Amplio catálogo con los mejores precios."
            />
        </div>

        <Field label="Palabras clave" hint="Separadas por coma">
            <Input
                value={cfg.seoKeywords}
                onChange={v => onChange({ seoKeywords: v })}
                placeholder="tienda online, productos, ofertas, Chile"
            />
        </Field>

        <ImageUploadField
            label="Imagen para redes sociales (OG Image)"
            value={cfg.ogImageUrl}
            onChange={v => onChange({ ogImageUrl: v })}
            previewClass="h-32"
            hint="Tamaño recomendado: 1200 × 630 px"
        />

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
    const [dirty, setDirty] = useState(false);

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
                    brandColor: ss.brandColor || '#6366f1',
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
        setDirty(true);
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
            toast.success('Cambios guardados', { style: { borderRadius: '12px' } });
            setDirty(false);
            if (storeSlug) setStoreLink(`${window.location.origin}/store/${storeSlug}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(storeLink);
        toast.success('Enlace copiado', { style: { borderRadius: '12px' } });
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
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Tienda Online</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Personaliza y gestiona tu e-commerce</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {storeLink && (
                            <a href={storeLink} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ver tienda</span>
                            </a>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 ${
                                dirty
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>

                {/* Status banner */}
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-5 text-sm font-medium ${
                    cfg.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    {cfg.isActive
                        ? <>Tu tienda está <strong>activa</strong>{storeLink && <a href={storeLink} target="_blank" rel="noreferrer" className="underline ml-1 text-emerald-600 truncate max-w-xs hidden sm:inline">{storeLink}</a>}</>
                        : <>Tu tienda está <strong>inactiva</strong> — actívala en General</>
                    }
                </div>

                {/* Panel */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        {TABS.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-4 text-xs font-bold transition-all border-b-2 -mb-px flex-1 justify-center ${
                                    activeTab === id
                                        ? 'text-indigo-600 border-indigo-600 bg-white'
                                        : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-white/60'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                                <span className="text-sm">Cargando configuración...</span>
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
                                    />
                                )}
                                {activeTab === 'seo' && (
                                    <SeoTab cfg={cfg} onChange={handleChange} storeName={storeName} />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Dirty indicator */}
                {dirty && !saving && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Tienes cambios sin guardar — presiona "Guardar cambios"
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
};
