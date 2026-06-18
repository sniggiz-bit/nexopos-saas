import { useState, useEffect, useRef } from 'react';
import { X, Upload, ImageIcon, Loader2, Plus, Trash2, Images } from 'lucide-react';
import { useCreateProduct } from '../../hooks/useCreateProduct';
import { useUpdateProduct } from '../../hooks/useUpdateProduct';
import { useCategories } from '../../hooks/useCategories';
import { useBrands } from '../../hooks/useBrands';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Product } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';

// ── Palette Dinámica (Alineado con el Tema Claro/Oscuro) ─────────────────────────
const getPalette = (theme: string) => {
    const isDark = theme === 'dark';
    return {
        bg:      isDark ? 'rgba(8,12,24,0.98)' : 'rgba(255,255,255,0.98)',
        surface: isDark ? 'rgba(16,24,44,0.95)' : 'rgba(245,247,250,0.95)',
        card:    isDark ? 'rgba(20,30,58,0.8)' : 'rgba(235,240,248,0.8)',
        border:  isDark ? 'rgba(0,153,204,0.12)' : 'rgba(0,153,204,0.22)',
        borderH: isDark ? 'rgba(0,153,204,0.28)' : 'rgba(0,153,204,0.48)',
        cyan:    '#0099CC',
        cyanA:   (a: number) => `rgba(0,153,204,${a})`,
        violet:  '#A78BFA',
        violetA: (a: number) => `rgba(167,139,250,${a})`,
        green:   '#34D399',
        greenA:  (a: number) => `rgba(52,211,153,${a})`,
        red:     '#F87171',
        redA:    (a: number) => `rgba(248,113,113,${a})`,
        text:    isDark ? 'rgba(210,225,245,0.92)' : 'rgba(15,23,42,0.92)',
        muted:   isDark ? 'rgba(180,195,220,0.5)' : 'rgba(75,85,99,0.7)',
        subtle:  isDark ? 'rgba(180,195,220,0.2)' : 'rgba(75,85,99,0.2)',
    };
};

const MAX_GALLERY = 4;

// ── Shared Input Style ───────────────────────────────────────────────────────
const inputCls = `
    w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-150
`.trim();

const inputStyle = (theme: string, focused: boolean = false): React.CSSProperties => {
    const C = getPalette(theme);
    return {
        background: focused ? C.cyanA(0.07) : C.cyanA(0.04),
        border: `1px solid ${focused ? C.borderH : C.border}`,
        color: C.text,
        fontSize: '13px',
        borderRadius: '8px',
        padding: '8px 12px',
        width: '100%',
        outline: 'none',
        transition: 'all 0.15s',
    };
};

const getLabelStyle = (theme: string): React.CSSProperties => {
    const C = getPalette(theme);
    return {
        display: 'block',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: C.muted,
        marginBottom: '6px',
    };
};

const getSectionStyle = (theme: string): React.CSSProperties => {
    const C = getPalette(theme);
    return {
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '16px',
    };
};

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Product | null;
}

// ── Focusable Input ──────────────────────────────────────────────────────────
function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const [focused, setFocused] = useState(false);
    const { theme } = useTheme();
    return (
        <input
            {...props}
            className={inputCls}
            style={inputStyle(theme, focused)}
            onFocus={e => { setFocused(true); props.onFocus?.(e); }}
            onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
        />
    );
}

function FocusSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const [focused, setFocused] = useState(false);
    const { theme } = useTheme();
    return (
        <select
            {...props}
            style={{
                ...inputStyle(theme, focused),
                cursor: 'pointer',
                // Override browser default arrow style
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(0,153,204,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '32px',
            }}
            onFocus={e  => { setFocused(true);  props.onFocus?.(e); }}
            onBlur={e   => { setFocused(false); props.onBlur?.(e); }}
        />
    );
}

// ── Image Slot Component ─────────────────────────────────────────────────────
function ImageSlot({
    url,
    index,
    onUpload,
    onRemove,
    uploading,
}: {
    url: string | null;
    index: number;
    onUpload: (file: File) => void;
    onRemove: () => void;
    uploading: boolean;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const { theme } = useTheme();
    const C = getPalette(theme);

    return (
        <div style={{ position: 'relative' }}>
            <input
                ref={ref}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                    e.target.value = '';
                }}
            />
            <div
                onClick={() => !url && !uploading && ref.current?.click()}
                style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    border: `1.5px dashed ${url ? C.cyanA(0.25) : C.border}`,
                    background: url ? 'transparent' : C.cyanA(0.03),
                    overflow: 'hidden',
                    cursor: url ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    position: 'relative',
                }}
                onMouseEnter={e => {
                    if (!url) (e.currentTarget as HTMLElement).style.borderColor = C.cyanA(0.4);
                }}
                onMouseLeave={e => {
                    if (!url) (e.currentTarget as HTMLElement).style.borderColor = C.border;
                }}
            >
                {uploading ? (
                    <Loader2 style={{ width: 20, height: 20, color: C.cyan, animation: 'spin 1s linear infinite' }} />
                ) : url ? (
                    <img src={url} alt={`Galería ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                        <Plus style={{ width: 18, height: 18, color: C.cyanA(0.3), margin: '0 auto 2px' }} />
                        <span style={{ fontSize: '10px', color: C.subtle }}>Imagen {index + 1}</span>
                    </div>
                )}
            </div>

            {/* Remove button */}
            {url && !uploading && (
                <button
                    type="button"
                    onClick={onRemove}
                    style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: C.redA(0.85),
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                >
                    <Trash2 style={{ width: 10, height: 10, color: '#fff' }} />
                </button>
            )}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function ProductFormModal({ isOpen, onClose, initialData }: ProductFormModalProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const C = getPalette(theme);
    const labelStyle = getLabelStyle(theme);
    const sectionStyle = getSectionStyle(theme);

    const [formData, setFormData] = useState({
        name:       '',
        sku:        '',
        barcode:    '',
        price:      '',
        costPrice:  '',
        stock:      '0',
        minStock:   '0',
        unitType:   'UNIT' as 'UNIT' | 'WEIGHT',
        categoryId: '',
        brandId:    '',
        supplierId: '',
        image:      '',
        isActive:   true,
    });

    const [galleryImages, setGalleryImages]         = useState<(string | null)[]>([null, null, null, null]);
    const [priceTiers, setPriceTiers]               = useState<{ minQuantity: string; unitPrice: string }[]>([]);
    const [uploadingMain, setUploadingMain]         = useState(false);
    const [uploadingSlot, setUploadingSlot]         = useState<number | null>(null);
    const mainFileRef = useRef<HTMLInputElement>(null);
    const wasOpenRef  = useRef(false);

    const queryClient  = useQueryClient();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const { data: categories } = useCategories(user?.tenantId ?? '');
    const { data: brands }     = useBrands(user?.tenantId ?? '');
    const { data: suppliers }  = useSuppliers(user?.tenantId ?? '');

    // ── Init form when modal opens ───────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) { wasOpenRef.current = false; return; }
        if (wasOpenRef.current) return;
        wasOpenRef.current = true;

        if (initialData) {
            setFormData({
                name:       initialData.name,
                sku:        initialData.sku || '',
                barcode:    initialData.barcode || '',
                price:      initialData.price.toString(),
                costPrice:  initialData.costPrice?.toString() || '',
                stock:      initialData.stock?.toString() || '0',
                minStock:   initialData.minStock?.toString() || '0',
                unitType:   initialData.unitType,
                categoryId: initialData.category?.id || '',
                brandId:    initialData.brand?.id || '',
                supplierId: initialData.supplier?.id || '',
                image:      initialData.image || '',
                isActive:   initialData.isActive,
            });
            // Populate gallery slots
            const existing = initialData.galleryImages ?? [];
            setGalleryImages([
                existing[0] ?? null,
                existing[1] ?? null,
                existing[2] ?? null,
                existing[3] ?? null,
            ]);
            setPriceTiers(initialData.priceTiers?.map(t => ({
                minQuantity: t.minQuantity.toString(),
                unitPrice:   t.unitPrice.toString(),
            })) || []);
        } else {
            setFormData({
                name: '', sku: '', barcode: '', price: '', costPrice: '',
                stock: '0', minStock: '0', unitType: 'UNIT',
                categoryId: '', brandId: '', supplierId: '', image: '', isActive: true,
            });
            setGalleryImages([null, null, null, null]);
            setPriceTiers([]);
        }
    }, [initialData, isOpen]);

    // ── Upload helper ────────────────────────────────────────────────────────
    const uploadFile = async (file: File): Promise<string> => {
        const form = new FormData();
        form.append('file', file);
        // Content-Type is NOT set manually — axios will set multipart/form-data + boundary automatically
        const { data } = await apiClient.post<{ url: string }>('/uploads/image', form);
        return data.url;
    };

    const handleMainImageFile = async (file: File) => {
        setUploadingMain(true);
        try {
            const url = await uploadFile(file);
            setFormData(prev => ({ ...prev, image: url }));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al subir la imagen principal');
        } finally {
            setUploadingMain(false);
        }
    };

    const handleGalleryUpload = async (file: File, index: number) => {
        setUploadingSlot(index);
        try {
            const url = await uploadFile(file);
            setGalleryImages(prev => {
                const next = [...prev];
                next[index] = url;
                return next;
            });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al subir imagen de galería');
        } finally {
            setUploadingSlot(null);
        }
    };

    const handleGalleryRemove = (index: number) => {
        setGalleryImages(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price) {
            toast.error('Nombre y precio son obligatorios');
            return;
        }

        const parsedTiers = priceTiers
            .filter(t => t.minQuantity && t.unitPrice)
            .map(t => ({ minQuantity: parseInt(t.minQuantity), unitPrice: parseInt(t.unitPrice) }));

        if (parsedTiers.some(t => t.unitPrice >= parseInt(formData.price))) {
            toast.error('El precio mayorista debe ser menor al precio de venta base.');
            return;
        }

        // Collect non-null gallery images
        const gallery = galleryImages.filter(Boolean) as string[];

        try {
            if (initialData) {
                await updateProduct.mutateAsync({
                    id:           initialData.id,
                    name:         formData.name,
                    sku:          formData.sku || undefined,
                    barcode:      formData.barcode || undefined,
                    price:        parseInt(formData.price),
                    costPrice:    parseInt(formData.costPrice) || 0,
                    minStock:     parseInt(formData.minStock) || 0,
                    stock:        parseInt(formData.stock) || 0,
                    unitType:     formData.unitType,
                    categoryId:   formData.categoryId || undefined,
                    brandId:      formData.brandId || undefined,
                    supplierId:   formData.supplierId || undefined,
                    image:        formData.image || undefined,
                    galleryImages: gallery,
                    isActive:     formData.isActive,
                    priceTiers:   parsedTiers.length > 0 ? parsedTiers : undefined,
                });
                queryClient.invalidateQueries({ queryKey: ['products-all'] });
                onClose();
            } else {
                await createProduct.mutateAsync({
                    name:          formData.name,
                    sku:           formData.sku || undefined,
                    barcode:       formData.barcode || undefined,
                    price:         parseInt(formData.price),
                    costPrice:     parseInt(formData.costPrice) || 0,
                    minStock:      parseInt(formData.minStock) || 0,
                    initialStock:  parseInt(formData.stock) || 0,
                    unitType:      formData.unitType,
                    categoryId:    formData.categoryId || undefined,
                    brandId:       formData.brandId || undefined,
                    supplierId:    formData.supplierId || undefined,
                    image:         formData.image || undefined,
                    galleryImages: gallery,
                    isActive:      formData.isActive,
                    tenantId:      user?.tenantId ?? '',
                    branchId:      user?.branchId ?? undefined,
                    priceTiers:    parsedTiers.length > 0 ? parsedTiers : undefined,
                });
                toast.success('Producto creado exitosamente');
                queryClient.invalidateQueries({ queryKey: ['products-all'] });
                onClose();
                setFormData({ name: '', sku: '', barcode: '', price: '', costPrice: '', stock: '0', minStock: '0', unitType: 'UNIT', categoryId: '', brandId: '', supplierId: '', image: '', isActive: true });
                setGalleryImages([null, null, null, null]);
                setPriceTiers([]);
            }
        } catch (error: any) {
            const action = initialData ? 'actualizar' : 'crear';
            toast.error(error.response?.data?.message || `Error al ${action} producto`);
        }
    };

    if (!isOpen) return null;

    const galleryCount = galleryImages.filter(Boolean).length;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: '16px',
        }}>
            {/* Glow */}
            <div style={{
                position: 'absolute', width: 500, height: 500, borderRadius: '50%',
                background: C.cyanA(0.04), filter: 'blur(80px)',
                pointerEvents: 'none',
            }} />

            <div style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '20px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: `0 0 60px ${C.cyanA(0.06)}, 0 32px 64px rgba(0,0,0,0.6)`,
                position: 'relative',
                scrollbarWidth: 'thin',
                scrollbarColor: `${C.cyanA(0.15)} transparent`,
            }}>

                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    position: 'sticky', top: 0, zIndex: 10,
                    background: C.bg,
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: C.text }}>
                            {initialData ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.muted }}>
                            {initialData ? 'Modifica los datos del producto' : 'Completa los datos para crear un producto'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: '8px',
                            background: C.cyanA(0.06), border: `1px solid ${C.border}`,
                            color: C.muted, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redA(0.12); (e.currentTarget as HTMLElement).style.color = C.red; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.cyanA(0.06); (e.currentTarget as HTMLElement).style.color = C.muted; }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Name */}
                    <div>
                        <label style={labelStyle}>Nombre del Producto *</label>
                        <FocusInput
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Coca Cola 1.5L"
                            required
                        />
                    </div>

                    {/* SKU & Barcode */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>SKU</label>
                            <FocusInput
                                type="text"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Código de Barras</label>
                            <FocusInput
                                type="text"
                                value={formData.barcode}
                                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                placeholder="Ej: 7790001234567"
                            />
                        </div>
                    </div>

                    {/* Price & Cost */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Precio de Venta (CLP) *</label>
                            <FocusInput
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="1500"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Precio de Costo (CLP)</label>
                            <FocusInput
                                type="number"
                                value={formData.costPrice}
                                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                placeholder="1000"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Wholesale Tiers */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: priceTiers.length > 0 ? 12 : 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                Precios por Volumen / Mayorista
                            </span>
                            <button
                                type="button"
                                onClick={() => setPriceTiers([...priceTiers, { minQuantity: '', unitPrice: '' }])}
                                style={{ fontSize: '12px', fontWeight: 700, color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                + Agregar Tramo
                            </button>
                        </div>
                        {priceTiers.length === 0 ? (
                            <p style={{ fontSize: '12px', color: C.subtle, margin: '8px 0 0' }}>
                                Sin tramos configurados. El producto usará el precio base.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {priceTiers.map((tier, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FocusInput
                                            type="number" min="2" placeholder="Cant. Min."
                                            value={tier.minQuantity}
                                            onChange={e => { const n = [...priceTiers]; n[i].minQuantity = e.target.value; setPriceTiers(n); }}
                                        />
                                        <FocusInput
                                            type="number" min="0" placeholder="Precio unitario"
                                            value={tier.unitPrice}
                                            onChange={e => { const n = [...priceTiers]; n[i].unitPrice = e.target.value; setPriceTiers(n); }}
                                        />
                                        <button type="button"
                                            onClick={() => setPriceTiers(priceTiers.filter((_, j) => j !== i))}
                                            style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: C.redA(0.1), border: `1px solid ${C.redA(0.2)}`, color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <X style={{ width: 12, height: 12 }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unit Type */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <div
                            onClick={() => setFormData({ ...formData, unitType: formData.unitType === 'WEIGHT' ? 'UNIT' : 'WEIGHT' })}
                            style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: formData.unitType === 'WEIGHT' ? C.cyan : C.cyanA(0.12),
                                border: `1px solid ${C.cyanA(0.3)}`,
                                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 2, left: formData.unitType === 'WEIGHT' ? 18 : 2,
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }} />
                        </div>
                        <span style={{ fontSize: '13px', color: C.text }}>
                            Venta a Granel (permite cantidades decimales como 0.5 kg)
                        </span>
                    </label>

                    {/* Category, Brand, Supplier */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Categoría</label>
                            <FocusSelect value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                                <option value="">Sin categoría</option>
                                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </FocusSelect>
                        </div>
                        <div>
                            <label style={labelStyle}>Marca</label>
                            <FocusSelect value={formData.brandId} onChange={e => setFormData({ ...formData, brandId: e.target.value })}>
                                <option value="">Sin marca</option>
                                {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </FocusSelect>
                        </div>
                        <div>
                            <label style={labelStyle}>Proveedor</label>
                            <FocusSelect value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                                <option value="">Sin proveedor</option>
                                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </FocusSelect>
                        </div>
                    </div>

                    {/* ── Image Section ─────────────────────────────────────────── */}
                    <div style={sectionStyle}>
                        {/* Main Image */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ ...labelStyle, marginBottom: 10 }}>
                                📷 Imagen Principal
                            </label>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                {/* Preview */}
                                <div style={{
                                    width: 80, height: 80, flexShrink: 0, borderRadius: '10px',
                                    border: `1.5px solid ${formData.image ? C.cyanA(0.25) : C.border}`,
                                    background: C.cyanA(0.04),
                                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {formData.image
                                        ? <img src={formData.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <ImageIcon style={{ width: 28, height: 28, color: C.cyanA(0.2) }} />
                                    }
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {/* Hidden file input */}
                                    <input
                                        ref={mainFileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleMainImageFile(file);
                                            e.target.value = '';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => mainFileRef.current?.click()}
                                        disabled={uploadingMain}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                            background: C.cyanA(0.1), border: `1px solid ${C.cyanA(0.25)}`,
                                            color: C.cyan, cursor: 'pointer', transition: 'all 0.15s',
                                            opacity: uploadingMain ? 0.6 : 1,
                                        }}
                                        onMouseEnter={e => { if (!uploadingMain) (e.currentTarget as HTMLElement).style.background = C.cyanA(0.18); }}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.1)}
                                    >
                                        {uploadingMain
                                            ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Subiendo...</>
                                            : <><Upload style={{ width: 13, height: 13 }} /> Subir imagen</>
                                        }
                                    </button>

                                    {/* URL fallback */}
                                    <FocusInput
                                        type="text"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="O pega una URL externa..."
                                    />

                                    {formData.image && (
                                        <button type="button" onClick={() => setFormData({ ...formData, image: '' })}
                                            style={{ fontSize: '11px', color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                                            ✕ Quitar imagen principal
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: C.border, margin: '0 -16px 16px' }} />

                        {/* Gallery */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <label style={{ ...labelStyle, margin: 0 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Images style={{ width: 13, height: 13 }} />
                                        Galería de Imágenes (tienda online)
                                    </span>
                                </label>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                                    background: galleryCount > 0 ? C.cyanA(0.1) : C.cyanA(0.04),
                                    border: `1px solid ${galleryCount > 0 ? C.cyanA(0.25) : C.border}`,
                                    color: galleryCount > 0 ? C.cyan : C.muted,
                                }}>
                                    {galleryCount}/{MAX_GALLERY}
                                </span>
                            </div>

                            <p style={{ fontSize: '11px', color: C.subtle, marginBottom: 12 }}>
                                Las imágenes de galería se mostrarán en la página del producto en tu tienda online.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                {Array.from({ length: MAX_GALLERY }).map((_, i) => (
                                    <ImageSlot
                                        key={i}
                                        index={i}
                                        url={galleryImages[i]}
                                        uploading={uploadingSlot === i}
                                        onUpload={file => handleGalleryUpload(file, i)}
                                        onRemove={() => handleGalleryRemove(i)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stock & Min Stock */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Stock Actual (Inventario)</label>
                            <FocusInput
                                type="number" value={formData.stock} min="0" placeholder="0"
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                            />
                            {initialData && (
                                <p style={{ marginTop: 4, fontSize: '11px', color: C.subtle }}>
                                    Para ajustar el stock, use el módulo de inventario.
                                </p>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>Stock Mínimo (Alerta)</label>
                            <FocusInput
                                type="number" value={formData.minStock} min="0" placeholder="10"
                                onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <div
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: formData.isActive ? C.green : C.cyanA(0.12),
                                border: `1px solid ${formData.isActive ? C.greenA(0.5) : C.cyanA(0.3)}`,
                                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 2, left: formData.isActive ? 18 : 2,
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }} />
                        </div>
                        <span style={{ fontSize: '13px', color: C.text }}>Producto activo</span>
                    </label>

                    {/* ── Actions ── */}
                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', gap: 10,
                        paddingTop: 16, borderTop: `1px solid ${C.border}`,
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                                background: C.cyanA(0.05), border: `1px solid ${C.border}`,
                                color: C.muted, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.1)}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.05)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createProduct.isPending || updateProduct.isPending}
                            style={{
                                padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: 800,
                                background: 'linear-gradient(135deg, rgba(0,153,204,0.25) 0%, rgba(0,153,204,0.12) 100%)',
                                border: `1px solid ${C.cyanA(0.4)}`,
                                color: C.cyan, cursor: 'pointer', transition: 'all 0.15s',
                                boxShadow: `0 0 20px ${C.cyanA(0.12)}`,
                                opacity: (createProduct.isPending || updateProduct.isPending) ? 0.6 : 1,
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,153,204,0.35) 0%, rgba(0,153,204,0.2) 100%)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,153,204,0.25) 0%, rgba(0,153,204,0.12) 100%)'}
                        >
                            {createProduct.isPending || updateProduct.isPending
                                ? 'Guardando...'
                                : initialData ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* CSS spin animation */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
