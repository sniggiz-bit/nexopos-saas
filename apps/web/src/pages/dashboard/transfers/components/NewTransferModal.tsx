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
            setProductResults(response.data);
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
            toast.error('Gelişti ya está en la lista');
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

                <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Nuevo Traspaso de Stock</h3>
                            <p className="text-sm text-gray-500 mt-1">Mueve inventario entre tus sucursales de forma segura.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sucursal Origen</label>
                                <select
                                    value={originBranchId}
                                    onChange={(e) => {
                                        setOriginBranchId(e.target.value);
                                        setItems([]); // Reset items because available stock changes
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    required
                                >
                                    <option value="">Selecciona origen...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} {b.isMain ? '(Principal)' : ''}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    El origen determina el stock disponible
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sucursal Destino</label>
                                <select
                                    value={destBranchId}
                                    onChange={(e) => setDestBranchId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    required
                                >
                                    <option value="">Selecciona destino...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} disabled={b.id === originBranchId}>
                                            {b.name} {b.isMain ? '(Principal)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Product Search - Only enable if origin is selected */}
                        <div className={`relative ${!originBranchId ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Agregar Productos</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={!originBranchId ? "Selecciona la sucursal de origen primero..." : "Buscar producto por nombre o SKU..."}
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
                                )}
                            </div>

                            {/* Search Results */}
                            {productResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                                    {productResults.map((product) => {
                                        const available = getAvailableStock(product, originBranchId);
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => available > 0 && addProduct(product)}
                                                className={`flex items-center justify-between px-4 py-3 border-b last:border-0 ${available > 0 ? 'hover:bg-blue-50 cursor-pointer' : 'opacity-60 bg-gray-50'
                                                    } transition-colors`}
                                            >
                                                <div>
                                                    <p className={`text-sm font-medium ${available > 0 ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{product.name}</p>
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
                                                                <span className="font-bold text-green-600 block text-sm">{available}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-red-500 font-semibold px-2 py-1 bg-red-50 rounded-md">Sin stock</span>
                                                        )}
                                                    </div>
                                                    {available > 0 && (
                                                        <button
                                                            type="button"
                                                            className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
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
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
                                    No se encontraron productos con "{productSearch}"
                                </div>
                            )}
                        </div>    {/* Items Table */}
                        {items.length > 0 && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Producto
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Stock Origen
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Cant. a Transferir
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                                    {(item.product.sku || item.product.barcode) && (
                                                        <p className="text-xs text-gray-500">
                                                            {item.product.sku} {item.product.barcode ? `| ${item.product.barcode}` : ''}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {item.availableStock} un.
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.availableStock}
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(index, e.target.value)}
                                                            className={`w-24 px-3 py-1.5 text-center text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors ${Number(item.quantity) > item.availableStock ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                                                }`}
                                                        />
                                                        {Number(item.quantity) > item.availableStock && (
                                                            <p className="text-[10px] text-red-600 font-medium absolute mt-1 w-full text-center">Excede stock!</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
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

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nota de Traspaso (Opcional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                placeholder="Motivo o detalle adicional del traspaso..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-white text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || items.length === 0}
                                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
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
        </div>
    );
}
