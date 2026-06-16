import { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle, RefreshCw, Loader2, Plus } from 'lucide-react';
import { api } from '../../../../api/client';
import { toast } from 'react-hot-toast';

interface Branch {
    id: string;
    name: string;
    isMain: boolean;
}

interface Product {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    inventoryLevels?: {
        quantity: number;
        branchId: string;
        branchName: string;
    }[];
}

interface TransferItem {
    product: Product;
    quantity: number | '';
    availableStock: number;
}

interface NewTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewTransferModal({ isOpen, onClose, onSuccess }: NewTransferModalProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [originBranchId, setOriginBranchId] = useState('');
    const [destBranchId, setDestBranchId] = useState('');
    const [note, setNote] = useState('');

    const [items, setItems] = useState<TransferItem[]>([]);

    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchBranches();
            resetForm();
        }
    }, [isOpen]);

    const searchProducts = async (query: string) => {
        if (!query || query.length < 2 || !originBranchId) {
            setProductResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get('/products', {
                params: { search: query, branchId: originBranchId } // Pass originBranchId to filter products by inventory
            });
            // Fixed bug: response.data is paginated object with structure { data: Product[], total: number, ... }
            setProductResults(response.data.data || []);
        } catch (error) {
            console.error('Error searching products:', error);
            toast.error('Error al buscar productos');
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-search when query changes (with debounce)
    useEffect(() => {
        const debounce = setTimeout(() => {
            searchProducts(productSearch);
        }, 400);
        return () => clearTimeout(debounce);
    }, [productSearch, originBranchId]);


    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            setBranches(response.data);
        } catch (error) {
            toast.error('Error al cargar sucursales');
            console.error('Error:', error);
        }
    };

    const resetForm = () => {
        setOriginBranchId('');
        setDestBranchId('');
        setNote('');
        setItems([]);
        setProductSearch('');
    };

    const getAvailableStock = (product: Product, branchId: string) => {
        if (!product.inventoryLevels) return 0;
        const inv = product.inventoryLevels.find(i => i.branchId === branchId);
        return inv ? Number(inv.quantity) : 0;
    };

    const addProduct = (product: Product) => {
        const availableStock = getAvailableStock(product, originBranchId);

        // Check if already added
        if (items.some(item => item.product.id === product.id)) {
            toast.error('El producto ya está en la lista');
            return;
        }

        setItems([...items, { product, quantity: 1, availableStock }]);
        setProductSearch('');
        setProductResults([]);
    };

    const updateQuantity = (index: number, value: string) => {
        const newItems = [...items];

        // Handle empty string allowing users to clear input and type
        if (value === '') {
            newItems[index].quantity = '';
            setItems(newItems);
            return;
        }

        const qty = Number(value);
        if (isNaN(qty) || qty < 0) return;

        newItems[index].quantity = qty;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!originBranchId || !destBranchId) {
            toast.error('Debes seleccionar origen y destino');
            return;
        }
        if (originBranchId === destBranchId) {
            toast.error('El origen y destino deben ser diferentes');
            return;
        }
        if (items.length === 0) {
            toast.error('Agrega al menos un producto');
            return;
        }

        // Validation
        for (const item of items) {
            const qty = Number(item.quantity) || 0;
            if (qty <= 0) {
                toast.error(`Cantidad inválida para ${item.product.name}`);
                return;
            }
            if (qty > item.availableStock) {
                toast.error(`Stock insuficiente para ${item.product.name} en la sucursal de origen`);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            await api.post('/transfers', {
                originBranchId,
                destBranchId,
                note,
                items: items.map(item => ({
                    productId: item.product.id,
                    quantity: Number(item.quantity)
                }))
            });

            toast.success('Traspaso realizado exitosamente');
            onSuccess();
        } catch (error: any) {
            console.error('Error creating transfer:', error);
            toast.error(error.response?.data?.message || 'Error al ejecutar traspaso');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-card/[0.95] border border-border rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Nuevo Traspaso de Stock</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Mueve inventario entre tus sucursales de forma segura.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-foreground hover:bg-card p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Body */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Branches Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-card/[0.5] rounded-xl border border-border">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Sucursal Origen</label>
                                <select
                                    value={originBranchId}
                                    onChange={(e) => {
                                        setOriginBranchId(e.target.value);
                                        setItems([]); // Reset items because available stock changes
                                    }}
                                    className="w-full px-4 py-2.5 bg-card/[0.8] border border-border rounded-xl text-foreground focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none transition-all"
                                    required
                                >
                                    <option value="" className="bg-[hsl(220,30%,8%)] text-gray-400">Selecciona origen...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} className="bg-[hsl(220,30%,8%)] text-white">
                                            {b.name} {b.isMain ? '(Principal)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                    El origen determina el stock disponible
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Sucursal Destino</label>
                                <select
                                    value={destBranchId}
                                    onChange={(e) => setDestBranchId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-card/[0.8] border border-border rounded-xl text-foreground focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none transition-all"
                                    required
                                >
                                    <option value="" className="bg-[hsl(220,30%,8%)] text-gray-400">Selecciona destino...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} disabled={b.id === originBranchId} className="bg-[hsl(220,30%,8%)] text-white">
                                            {b.name} {b.isMain ? '(Principal)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Product Search */}
                        <div className={`relative ${!originBranchId ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Agregar Productos</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={!originBranchId ? "Selecciona la sucursal de origen primero..." : "Buscar producto por nombre o SKU..."}
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-card/[0.8] border border-border rounded-xl text-foreground placeholder-slate-500 focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none transition-all text-sm"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-[#0099CC]" />
                                )}
                            </div>

                            {/* Search Results */}
                            {productResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-card/[0.98] border border-border rounded-xl shadow-2xl max-h-60 overflow-auto backdrop-blur-md">
                                    {productResults.map((product) => {
                                        const available = getAvailableStock(product, originBranchId);
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => available > 0 && addProduct(product)}
                                                className={`flex items-center justify-between px-4 py-3 border-b border-border last:border-0 ${
                                                    available > 0 ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60 bg-muted/20 cursor-not-allowed'
                                                } transition-colors`}
                                            >
                                                <div>
                                                    <p className={`text-sm font-medium ${available > 0 ? 'text-foreground' : 'text-gray-500 line-through'}`}>{product.name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                        {product.sku && <span>SKU: {product.sku}</span>}
                                                        {product.barcode && <span>EAN: {product.barcode}</span>}
                                                    </p>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    <div className="text-xs text-right">
                                                        {available > 0 ? (
                                                            <>
                                                                <span className="text-gray-500 block">Stock Disponible</span>
                                                                <span className="font-bold text-emerald-400 block text-sm">{available}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-red-400 font-semibold px-2.5 py-1 bg-red-950/20 border border-red-500/20 rounded-md">Sin stock</span>
                                                        )}
                                                    </div>
                                                    {available > 0 && (
                                                        <button
                                                            type="button"
                                                            className="p-1.5 bg-[#0099CC]/10 text-[#0099CC] hover:bg-[#0099CC]/20 border border-[#0099CC]/20 rounded-md transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty Results Case */}
                            {productSearch.length >= 2 && !isSearching && productResults.length === 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-2xl p-4 text-center text-gray-400">
                                    No se encontraron productos con "{productSearch}"
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        {items.length > 0 && (
                            <div className="border border-border rounded-xl overflow-hidden bg-card/[0.2]">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Producto
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Stock Origen
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Cant. a Transferir
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                                                    {(item.product.sku || item.product.barcode) && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.product.sku} {item.product.barcode ? `| ${item.product.barcode}` : ''}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted border border-border text-foreground">
                                                        {item.availableStock} un.
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="inline-block relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.availableStock}
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(index, e.target.value)}
                                                            className={`w-24 px-3 py-1.5 text-center text-sm bg-card border rounded-lg focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none transition-colors text-foreground ${
                                                                Number(item.quantity) > item.availableStock 
                                                                    ? 'border-red-500 bg-red-500/10 text-red-400 focus:border-red-500 focus:ring-red-500' 
                                                                    : 'border-border'
                                                            }`}
                                                        />
                                                        {Number(item.quantity) > item.availableStock && (
                                                            <p className="text-[10px] text-red-400 font-medium absolute mt-1 w-full text-center">Excede stock!</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 bg-transparent border border-red-500/15 p-2 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Note */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Nota de Traspaso (Opcional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-card/[0.8] border border-border rounded-xl text-foreground placeholder-slate-500 focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none transition-all text-sm"
                                placeholder="Motivo o detalle adicional del traspaso..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-transparent hover:bg-card hover:text-foreground rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || items.length === 0}
                            className="inline-flex items-center px-6 py-2.5 bg-[#0099CC] text-[#0B0F1A] font-bold text-sm rounded-xl hover:bg-[#00BCE0] hover:shadow-[0_0_15px_rgba(0,153,204,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    Ejecutando...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Ejecutar Traspaso
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
