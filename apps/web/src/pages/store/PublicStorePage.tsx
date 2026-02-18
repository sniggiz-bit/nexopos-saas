import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, MessageCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

// Interfaces (Should be in types.ts but defining here for speed/isolation if types.ts isn't fully updated or shared easily yet)
interface StoreProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: { name: string };
}

interface CartItem extends StoreProduct {
    quantity: number;
}

interface StoreData {
    name: string;
    storeSettings: {
        whatsappNumber: string;
        brandColor: string;
        bannerUrl?: string;
    };
}

export const PublicStorePage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [store, setStore] = useState<StoreData | null>(null);
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const storeRes = await api.get(`/store/${slug}`);
                setStore(storeRes.data);
                const productsRes = await api.get(`/store/${slug}/products`);
                setProducts(productsRes.data);
            } catch (error) {
                console.error(error);
                // Handle 404 or inactive
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [slug]);

    const addToCart = (product: StoreProduct) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success('Agregado al carrito');
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        if (!store) return;

        const message = `Hola ${store.name}, quiero hacer un pedido:
${cart.map(item => `${item.quantity}x ${item.name} ($${item.price.toLocaleString('es-CL')})`).join('\n')}

Total: $${cartTotal.toLocaleString('es-CL')}
¿Me confirman disponibilidad?`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${store.storeSettings.whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || p.category?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="h-screen flex items-center justify-center">Cargando tienda...</div>;
    if (!store) return <div className="h-screen flex items-center justify-center">Tienda no encontrada</div>;

    const brandColor = store.storeSettings.brandColor || '#3B82F6';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow">
                {store.storeSettings.bannerUrl && (
                    <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${store.storeSettings.bannerUrl})` }}></div>
                )}
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="sticky top-0 z-10 bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2"
                            style={{ ['--tw-ring-color' as any]: brandColor }}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === cat ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                style={{ backgroundColor: selectedCategory === cat ? brandColor : undefined }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                            {product.image && (
                                <img src={product.image} alt={product.name} className="h-48 w-full object-cover" />
                            )}
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                <div className="mt-auto pt-4 flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="p-2 rounded-full text-white transition-opacity hover:opacity-90"
                                        style={{ backgroundColor: brandColor }}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Cart Button */}
            {cartCount > 0 && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105"
                    style={{ backgroundColor: brandColor }}
                >
                    <ShoppingCart className="w-6 h-6" />
                    <span className="font-bold">{cartCount}</span>
                </button>
            )}

            {/* Cart Drawer/Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-slide-in">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold">Tu Pedido</h2>
                            <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    {item.image && <img src={item.image} alt="" className="w-16 h-16 rounded object-cover" />}
                                    <div className="flex-1">
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-gray-500">${item.price.toLocaleString('es-CL')}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"><Minus className="w-4 h-4" /></button>
                                            <span className="font-medium w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        ${(item.price * item.quantity).toLocaleString('es-CL')}
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 self-start">
                                        <div className="sr-only">Eliminar</div>
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t bg-gray-50">
                            <div className="flex justify-between items-center mb-4 text-lg font-bold">
                                <span>Total</span>
                                <span>${cartTotal.toLocaleString('es-CL')}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: '#25D366' }} // WhatsApp color
                            >
                                <MessageCircle className="w-5 h-5" />
                                Pedir por WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
