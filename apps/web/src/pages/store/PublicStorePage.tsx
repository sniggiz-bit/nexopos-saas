import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, X, Search, SlidersHorizontal,
  ChevronLeft, ChevronRight, Tag, Package, MessageCircle,
  ArrowUpDown, XCircle, Star,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface PriceTier {
  minQuantity: number;
  unitPrice: number;
}

interface StoreProduct {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  image?: string;
  stock: number;
  unitType: 'UNIT' | 'WEIGHT';
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  priceTiers: PriceTier[];
}

interface CartItem extends StoreProduct {
  quantity: number;
}

interface StoreFilters {
  categories: { id: string; name: string; _count: { products: number } }[];
  brands: { id: string; name: string; _count: { products: number } }[];
}

interface Slide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface StoreData {
  id: string;
  name: string;
  storeSlug: string;
  mainBranchId?: string;
  storeSettings: {
    whatsappNumber?: string;
    brandColor?: string;
    bannerUrl?: string;
    isActive: boolean;
    announcementEnabled?: boolean;
    announcementText?: string;
    announcementColor?: string;
    sliders?: Slide[];
    featuredProductIds?: string[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCLP = (price: number) =>
  `$${Math.round(price).toLocaleString('es-CL')}`;

const getStockStatus = (stock: number) => {
  if (stock <= 0) return { label: 'Sin stock', color: '#ef4444', available: false };
  if (stock <= 5) return { label: `Últimas ${stock}`, color: '#f97316', available: true };
  return { label: 'En stock', color: '#22c55e', available: true };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-sm">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-200 rounded-full w-1/3" />
      <div className="h-4 bg-gray-200 rounded-full w-4/5" />
      <div className="h-4 bg-gray-200 rounded-full w-3/5" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-gray-200 rounded-full w-1/3" />
        <div className="h-9 w-20 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </div>
);

// ── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: StoreProduct;
  brandColor: string;
  onAddToCart: (product: StoreProduct) => void;
  onViewDetail: (product: StoreProduct) => void;
}

const ProductCard = ({ product, brandColor, onAddToCart, onViewDetail }: ProductCardProps) => {
  const stock = getStockStatus(product.stock);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 hover:border-gray-200">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
        onClick={() => onViewDetail(product)}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-gray-200" />
          </div>
        )}

        {/* Brand pill */}
        {product.brand && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-700 px-2 py-0.5 rounded-full shadow-sm">
            {product.brand.name}
          </span>
        )}

        {/* Stock badge */}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimas!
          </span>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="bg-gray-800/90 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
              Sin stock
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="bg-white text-gray-800 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            Ver detalles
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">
            {product.category.name}
          </p>
        )}
        <h3
          className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 cursor-pointer hover:underline mb-2"
          onClick={() => onViewDetail(product)}
        >
          {product.name}
        </h3>

        {product.priceTiers.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mb-2">
            <Tag className="w-2.5 h-2.5" />
            Precio mayorista
          </span>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCLP(product.price)}</p>
            {product.unitType === 'WEIGHT' && (
              <p className="text-[10px] text-gray-400">por kg</p>
            )}
          </div>
          <button
            onClick={() => stock.available && onAddToCart(product)}
            disabled={!stock.available}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 hover:brightness-90"
            style={{ backgroundColor: stock.available ? brandColor : '#9ca3af' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Product Modal ─────────────────────────────────────────────────────────────

interface ProductModalProps {
  product: StoreProduct | null;
  brandColor: string;
  storeName: string;
  whatsappNumber?: string;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, qty: number) => void;
}

const ProductModal = ({
  product, brandColor, storeName, whatsappNumber, onClose, onAddToCart,
}: ProductModalProps) => {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setQty(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;

  const stock = getStockStatus(product.stock);
  const activeTier = [...product.priceTiers]
    .filter(t => qty >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  const activePrice = activeTier?.unitPrice ?? product.price;
  const hasTierDiscount = activeTier != null && activeTier.unitPrice < product.price;

  const handleWhatsApp = () => {
    if (!whatsappNumber) return;
    const msg = `Hola ${storeName}, me interesa:\n${qty}x ${product.name} — ${formatCLP(activePrice * qty)}\n¿Tienen disponibilidad?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="md:grid md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-gray-50 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-200" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              {product.category && <span>{product.category.name}</span>}
              {product.brand && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>{product.brand.name}</span>
                </>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>

            {/* Stock indicator */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: stock.color }}
              />
              <span className="text-sm font-medium" style={{ color: stock.color }}>
                {stock.label}
              </span>
            </div>

            {/* Price */}
            <div>
              {hasTierDiscount ? (
                <div className="space-y-0.5">
                  <p className="text-sm text-gray-400 line-through">{formatCLP(product.price)} c/u</p>
                  <p className="text-3xl font-black" style={{ color: brandColor }}>
                    {formatCLP(activePrice)}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600">Precio por volumen activo</p>
                </div>
              ) : (
                <p className="text-3xl font-black text-gray-900">{formatCLP(product.price)}</p>
              )}
            </div>

            {/* Price tiers */}
            {product.priceTiers.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                <p className="text-xs font-bold text-emerald-700 mb-2">Precios por volumen</p>
                <div className="space-y-1">
                  {product.priceTiers.map(tier => (
                    <div
                      key={tier.minQuantity}
                      className={`flex justify-between text-xs ${qty >= tier.minQuantity ? 'font-bold text-emerald-700' : 'text-emerald-600/70'}`}
                    >
                      <span>+{tier.minQuantity} unidades</span>
                      <span>{formatCLP(tier.unitPrice)} c/u</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Cantidad</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-900">{qty}</span>
                <button
                  onClick={() => setQty(q => product.stock > 0 ? Math.min(product.stock, q + 1) : q)}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm font-bold text-gray-700 ml-auto">
                {formatCLP(activePrice * qty)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => {
                  if (!stock.available) return;
                  onAddToCart(product, qty);
                  onClose();
                }}
                disabled={!stock.available}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-150 disabled:opacity-40 active:scale-98 hover:brightness-90"
                style={{ backgroundColor: stock.available ? brandColor : '#9ca3af' }}
              >
                {stock.available
                  ? `Agregar al carrito — ${formatCLP(activePrice * qty)}`
                  : 'Sin stock disponible'}
              </button>
              {whatsappNumber && (
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-3 rounded-2xl border-2 border-[#25D366] text-[#25D366] font-semibold text-sm hover:bg-[#25D366]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar por WhatsApp
                </button>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Descripción</p>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}
            {product.sku && (
              <p className="text-xs text-gray-400">SKU: {product.sku}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Cart Drawer ───────────────────────────────────────────────────────────────

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  storeName: string;
  whatsappNumber?: string;
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartDrawer = ({
  isOpen, cart, storeName, whatsappNumber,
  onClose, onUpdateQty, onRemove,
}: CartDrawerProps) => {
  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handleCheckout = () => {
    if (!whatsappNumber) {
      toast.error('La tienda no tiene WhatsApp configurado');
      return;
    }
    const lines = cart
      .map(i => `${i.quantity}x ${i.name} — ${formatCLP(i.price * i.quantity)}`)
      .join('\n');
    const msg = `Hola ${storeName}, quiero hacer un pedido:\n\n${lines}\n\n*Total: ${formatCLP(total)}*\n\n¿Me confirman disponibilidad?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tu carrito</h2>
            <p className="text-xs text-gray-400">
              {count} {count === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-300">
              <ShoppingCart className="w-16 h-16" />
              <p className="text-sm font-medium text-gray-400">Tu carrito está vacío</p>
              <p className="text-xs text-gray-300">Agrega productos para continuar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{formatCLP(item.price)} c/u</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCLP(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCLP(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#1fbc58] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <MessageCircle className="w-5 h-5" />
              Pedir por WhatsApp
            </button>
            <button
              onClick={onClose}
              className="w-full text-xs text-center text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              Continuar comprando →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ── Filter Sidebar ────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: StoreFilters;
  activeCategory: string;
  activeBrand: string;
  brandColor: string;
  onCategoryChange: (id: string) => void;
  onBrandChange: (id: string) => void;
  onClear: () => void;
}

const FilterPanel = ({
  filters, activeCategory, activeBrand, brandColor,
  onCategoryChange, onBrandChange, onClear,
}: FilterPanelProps) => {
  const activeCount = [activeCategory, activeBrand].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {activeCount > 0 && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-semibold hover:underline"
          style={{ color: brandColor }}
        >
          <X className="w-3 h-3" />
          Limpiar filtros ({activeCount})
        </button>
      )}

      {filters.brands.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Marcas
          </p>
          <div className="space-y-0.5">
            {filters.brands.map(b => (
              <button
                key={b.id}
                onClick={() => onBrandChange(activeBrand === b.id ? '' : b.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-150 flex justify-between items-center ${
                  activeBrand === b.id
                    ? 'font-bold text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ backgroundColor: activeBrand === b.id ? brandColor : undefined }}
              >
                <span>{b.name}</span>
                <span className={`${activeBrand === b.id ? 'text-white/60' : 'text-gray-400'}`}>
                  {b._count.products}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filters.categories.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Categorías
          </p>
          <div className="space-y-0.5">
            {filters.categories.map(c => (
              <button
                key={c.id}
                onClick={() => onCategoryChange(activeCategory === c.id ? '' : c.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-150 flex justify-between items-center ${
                  activeCategory === c.id
                    ? 'font-bold text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ backgroundColor: activeCategory === c.id ? brandColor : undefined }}
              >
                <span>{c.name}</span>
                <span className={`${activeCategory === c.id ? 'text-white/60' : 'text-gray-400'}`}>
                  {c._count.products}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Slider Carousel ───────────────────────────────────────────────────────────

const SliderCarousel = ({ slides, brandColor }: { slides: Slide[]; brandColor: string }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (idx: number) => setCurrent(((idx % slides.length) + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setTimeout(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, slides.length]);

  if (!slides.length) return null;
  const slide = slides[current];

  return (
    <div className="relative w-full overflow-hidden bg-gray-900 h-52 sm:h-72 md:h-80">
      {/* Image */}
      {slide.imageUrl && (
        <img
          key={current}
          src={slide.imageUrl}
          alt={slide.title || ''}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      {/* Content */}
      {(slide.title || slide.subtitle || slide.buttonText) && (
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-10 sm:p-8 sm:pb-12">
          {slide.title && (
            <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-lg leading-tight">
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p className="text-sm sm:text-base text-white/80 mt-1 drop-shadow">{slide.subtitle}</p>
          )}
          {slide.buttonText && slide.buttonLink && (
            <a
              href={slide.buttonLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:brightness-90 transition-all active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              {slide.buttonText}
            </a>
          )}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const PublicStorePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [storeFilters, setStoreFilters] = useState<StoreFilters>({ categories: [], brands: [] });
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeBrand, setActiveBrand] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'newest'>('name');

  const debouncedSearch = useDebounce(searchInput, 400);
  const searchRef = useRef<HTMLInputElement>(null);
  const brandColor = store?.storeSettings.brandColor || '#3B82F6';

  // Initial: fetch store + filters
  useEffect(() => {
    const load = async () => {
      try {
        const [storeRes, filtersRes] = await Promise.all([
          api.get(`/store/${slug}`),
          api.get(`/store/${slug}/filters`).catch(() => ({ data: { categories: [], brands: [] } })),
        ]);
        setStore(storeRes.data);
        setStoreFilters(filtersRes.data);
      } catch {
        setStoreError('Tienda no encontrada o no disponible');
      } finally {
        setLoadingStore(false);
      }
    };
    load();
  }, [slug]);

  // Fetch products when filters change
  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    setLoadingProducts(true);

    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (activeCategory) params.categoryId = activeCategory;
    if (activeBrand) params.brandId = activeBrand;
    if (sortBy !== 'name') params.sort = sortBy;

    api
      .get(`/store/${slug}/products`, { params })
      .then(res => { if (!cancelled) setProducts(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingProducts(false); });

    return () => { cancelled = true; };
  }, [store, slug, debouncedSearch, activeCategory, activeBrand, sortBy]);

  // Cart handlers
  const addToCart = useCallback((product: StoreProduct, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { ...product, quantity: qty }];
    });
    toast.success(`${product.name} agregado`, {
      style: { borderRadius: '12px', fontSize: '14px' },
    });
  }, []);

  const updateCartQty = useCallback((id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveCategory('');
    setActiveBrand('');
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const activeFiltersCount = [activeCategory, activeBrand].filter(Boolean).length;
  const hasSidebar = storeFilters.categories.length > 0 || storeFilters.brands.length > 0;

  const featuredProducts = useMemo(() => {
    const ids = store?.storeSettings.featuredProductIds;
    if (!ids?.length || searchInput || activeCategory || activeBrand) return [];
    const idSet = new Set(ids);
    return products.filter(p => idSet.has(p.id));
  }, [products, store, searchInput, activeCategory, activeBrand]);

  const sliders = store?.storeSettings.sliders ?? [];
  const hasSliders = sliders.length > 0;

  if (storeError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <XCircle className="w-16 h-16 text-gray-200 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-700">Tienda no disponible</h1>
          <p className="text-gray-400 text-sm">{storeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        {/* Announcement Bar */}
        {store?.storeSettings.announcementEnabled && store.storeSettings.announcementText && (
          <div
            className="w-full py-2 px-4 text-center text-xs font-semibold text-white tracking-wide"
            style={{ backgroundColor: store.storeSettings.announcementColor || '#10b981' }}
          >
            {store.storeSettings.announcementText}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">

            {/* Store name / logo */}
            <div className="flex-shrink-0 min-w-0">
              {store?.storeSettings.logoUrl ? (
                <img
                  src={store.storeSettings.logoUrl}
                  alt={store.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span
                  className="text-base font-black tracking-tight truncate block"
                  style={{ color: brandColor }}
                >
                  {loadingStore ? '···' : store?.name}
                </span>
              )}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-9 pr-8 py-2 bg-gray-100 hover:bg-gray-200/80 focus:bg-white border-2 border-transparent focus:border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Cart button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-bold transition-all duration-150 active:scale-95 hover:brightness-90"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Slider Carousel ─────────────────────────────────────────────────── */}
      {hasSliders && <SliderCarousel slides={sliders} brandColor={brandColor} />}

      {/* ── Hero Banner (solo si no hay sliders) ─────────────────────────── */}
      {!hasSliders && (
        store?.storeSettings.bannerUrl ? (
          <div
            className="w-full h-44 sm:h-60 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${store.storeSettings.bannerUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10 flex items-end pb-6 px-6">
              <h2 className="text-white text-2xl sm:text-3xl font-black drop-shadow-lg">
                {store.name}
              </h2>
            </div>
          </div>
        ) : !loadingStore && store ? (
          <div
            className="w-full py-8 px-6 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}08 100%)` }}
          >
            <h2 className="text-2xl font-black" style={{ color: brandColor }}>{store.name}</h2>
          </div>
        ) : null
      )}

      {/* ── Category pills (quick nav) ──────────────────────────────────────── */}
      {storeFilters.categories.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategory('')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  !activeCategory ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{ backgroundColor: !activeCategory ? brandColor : undefined }}
              >
                Todos
              </button>
              {storeFilters.categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    activeCategory === cat.id
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: activeCategory === cat.id ? brandColor : undefined }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Featured Products ───────────────────────────────────────────────── */}
      {!loadingProducts && featuredProducts.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                Destacados
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredProducts.map(product => (
                <div key={product.id} className="flex-shrink-0 w-36 sm:w-44">
                  <ProductCard
                    product={product}
                    brandColor={brandColor}
                    onAddToCart={p => addToCart(p)}
                    onViewDetail={setSelectedProduct}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          {hasSidebar && (
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <FilterPanel
                  filters={storeFilters}
                  activeCategory={activeCategory}
                  activeBrand={activeBrand}
                  brandColor={brandColor}
                  onCategoryChange={setActiveCategory}
                  onBrandChange={setActiveBrand}
                  onClear={clearFilters}
                />
              </div>
            </aside>
          )}

          {/* Product area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 font-medium">
                  {loadingProducts
                    ? 'Buscando...'
                    : `${products.length} producto${products.length !== 1 ? 's' : ''}`}
                </p>

                {/* Mobile filter button */}
                {hasSidebar && (
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <span
                        className="w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                        style={{ backgroundColor: brandColor }}
                      >
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-gray-300 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="text-xs text-gray-600 border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:border-gray-300 cursor-pointer"
                >
                  <option value="name">Nombre A–Z</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="newest">Más recientes</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {loadingStore || (loadingProducts && products.length === 0) ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Package className="w-16 h-16 text-gray-200" />
                <h3 className="text-base font-bold text-gray-500">Sin productos</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  {searchInput || activeCategory || activeBrand
                    ? 'No hay resultados con los filtros aplicados.'
                    : 'Esta tienda no tiene productos publicados aún.'}
                </p>
                {(searchInput || activeCategory || activeBrand) && (
                  <button
                    onClick={() => { setSearchInput(''); clearFilters(); }}
                    className="text-xs font-semibold underline mt-1"
                    style={{ color: brandColor }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  hasSidebar
                    ? 'grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                }`}
              >
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    brandColor={brandColor}
                    onAddToCart={p => addToCart(p)}
                    onViewDetail={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Sheet ─────────────────────────────────────────────── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Filtros</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <FilterPanel
              filters={storeFilters}
              activeCategory={activeCategory}
              activeBrand={activeBrand}
              brandColor={brandColor}
              onCategoryChange={setActiveCategory}
              onBrandChange={setActiveBrand}
              onClear={clearFilters}
            />
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full mt-6 py-3.5 rounded-2xl text-white font-bold text-sm"
              style={{ backgroundColor: brandColor }}
            >
              Ver {products.length} resultado{products.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── Cart Drawer ─────────────────────────────────────────────────────── */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        storeName={store?.name ?? ''}
        whatsappNumber={store?.storeSettings.whatsappNumber}
        onClose={() => setIsCartOpen(false)}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
      />

      {/* ── Product Modal ────────────────────────────────────────────────────── */}
      <ProductModal
        product={selectedProduct}
        brandColor={brandColor}
        storeName={store?.name ?? ''}
        whatsappNumber={store?.storeSettings.whatsappNumber}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-gray-100 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-300">
            {store?.name} · Tienda online powered by{' '}
            <span className="font-bold" style={{ color: brandColor }}>NexoPOS</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
