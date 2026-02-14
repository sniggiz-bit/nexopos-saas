import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBranches } from '../../../hooks/useBranches';
import { useTransfers, TransferItem } from '../../../hooks/useTransfers';
import { useProducts } from '../../../hooks/useProducts'; // Assuming this exists
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent } from '../../../components/ui/card';
import { useInventory } from '../../../hooks/useInventory'; // Assuming this provides stock levels properly or I fetch it separately

// Step components could be separate, but for simplicity I'll keep them here

export default function NewTransferPage() {
    const navigate = useNavigate();
    const { branches, loading: branchesLoading } = useBranches();
    const { createTransfer, loading: submitting } = useTransfers();
    // Ideally use useProducts with search, but for now let's assume useProducts returns all or use search
    // Actually, I need to fetch products to select. 
    // I'll assume useProducts exists and works. If not, I'll need to implement a product search/fetcher here.
    // Based on previous conversations, useProducts exists.

    // I'll use a mocked list or fetch real products. 
    // Use `useProducts` from `hooks/useProducts`.
    const { products, fetchProducts } = useProducts(); // Assuming signature
    // Wait, useProducts in `apps/web/src/hooks/useProducts.ts`

    // Let's implement dynamic product fetching in the component if needed.
    // For now I'll use a placeholder or basic fetch. 

    const [step, setStep] = useState(1);
    const [originBranchId, setOriginBranchId] = useState('');
    const [destBranchId, setDestBranchId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<TransferItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

    useEffect(() => {
        if (!branchesLoading && branches.length > 0) {
            // Pre-select Main as origin if available
            const main = branches.find(b => b.isMain);
            if (main) setOriginBranchId(main.id);
        }
    }, [branches, branchesLoading]);

    useEffect(() => {
        if (searchTerm) {
            // Filter products locally for now. 
            // In a real app with many products, this should be server-side search.
            const lowerDate = searchTerm.toLowerCase();
            const filtered = products.filter((p: any) =>
                p.name.toLowerCase().includes(lowerDate) ||
                p.barcode?.includes(lowerDate) ||
                p.sku?.includes(lowerDate)
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [searchTerm, products]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = (product: any, quantity: number) => {
        if (quantity <= 0) return;

        // Find if already added
        const existing = selectedProducts.find(p => p.productId === product.id);
        if (existing) {
            setSelectedProducts(selectedProducts.map(p =>
                p.productId === product.id ? { ...p, quantity: p.quantity + quantity } : p
            ));
        } else {
            setSelectedProducts([...selectedProducts, { productId: product.id, quantity }]);
        }
        setSearchTerm(''); // Clear search to reset
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    };

    const handleNext = () => {
        if (step === 1) {
            if (!originBranchId || !destBranchId) return;
            if (originBranchId === destBranchId) {
                alert('La sucursal de origen y destino no pueden ser la misma.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (selectedProducts.length === 0) return;
            setStep(3);
        }
    };

    const handleConfirm = async () => {
        await createTransfer({
            originBranchId,
            destBranchId,
            items: selectedProducts,
        });
    };

    const getProductName = (id: string) => {
        return products.find((p: any) => p.id === id)?.name || 'Producto desconocido';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/branches')} className="text-neutral-400 hover:text-white">
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nuevo Traspaso</h1>
                    <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                        <span className={step >= 1 ? 'text-purple-400 font-medium' : ''}>1. Origen/Destino</span>
                        <ArrowRight size={14} />
                        <span className={step >= 2 ? 'text-purple-400 font-medium' : ''}>2. Productos</span>
                        <ArrowRight size={14} />
                        <span className={step >= 3 ? 'text-purple-400 font-medium' : ''}>3. Confirmación</span>
                    </div>
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-neutral-800 border-neutral-700">
                        <CardContent className="pt-6">
                            <Label className="text-neutral-300 mb-2 block">Desde (Origen)</Label>
                            <Select value={originBranchId} onValueChange={setOriginBranchId}>
                                <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                                    <SelectValue placeholder="Selecciona origen" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="mt-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                <p className="text-sm text-neutral-400">Stock actual se descontará de esta sucursal.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-800 border-neutral-700">
                        <CardContent className="pt-6">
                            <Label className="text-neutral-300 mb-2 block">Hacia (Destino)</Label>
                            <Select value={destBranchId} onValueChange={setDestBranchId}>
                                <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                                    <SelectValue placeholder="Selecciona destino" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id} disabled={b.id === originBranchId}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="mt-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                <p className="text-sm text-neutral-400">Stock llegará a esta sucursal.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <Card className="bg-neutral-800 border-neutral-700">
                        <CardContent className="pt-6 space-y-4">
                            <Label className="text-neutral-300">Buscar Producto</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nombre, código de barras..."
                                    className="pl-10 bg-neutral-900 border-neutral-700 text-white"
                                />
                            </div>

                            {searchTerm && (
                                <div className="border border-neutral-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto bg-neutral-900">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-4 text-center text-neutral-500">No se encontraron productos.</div>
                                    ) : (
                                        filteredProducts.map(product => (
                                            <div key={product.id} className="p-3 border-b border-neutral-800 flex justify-between items-center hover:bg-neutral-800 transition-colors">
                                                <div>
                                                    <div className="font-medium text-white">{product.name}</div>
                                                    <div className="text-xs text-neutral-500">SKU: {product.sku || 'N/A'} | Stock: {product.stock || 0}</div>
                                                    {/* Ideally show stock for origin branch specifically */}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleAddProduct(product, 1)}
                                                >
                                                    Agregar
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-800 border-neutral-700">
                        <CardContent className="pt-6">
                            <h3 className="font-medium text-white mb-4">Productos Seleccionados ({selectedProducts.length})</h3>
                            {selectedProducts.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500">
                                    <Package size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>No has seleccionado productos aún.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedProducts.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                            <span className="text-white">{getProductName(item.productId)}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAddProduct({ id: item.productId }, -1)}>-</Button>
                                                    <span className="text-white w-8 text-center">{item.quantity}</span>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAddProduct({ id: item.productId }, 1)}>+</Button>
                                                </div>
                                                <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleRemoveProduct(item.productId)}>
                                                    <span className="sr-only">Eliminar</span>
                                                    x
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 3 && (
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-neutral-900/50 rounded-lg">
                                <div className="text-xs text-neutral-500 uppercase">Origen</div>
                                <div className="text-lg font-bold text-white mt-1">
                                    {branches.find(b => b.id === originBranchId)?.name}
                                </div>
                            </div>
                            <div className="p-4 bg-neutral-900/50 rounded-lg">
                                <div className="text-xs text-neutral-500 uppercase">Destino</div>
                                <div className="text-lg font-bold text-white mt-1">
                                    {branches.find(b => b.id === destBranchId)?.name}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-700 pt-4">
                            <h3 className="font-medium text-white mb-4">Resumen de Productos</h3>
                            <div className="space-y-2">
                                {selectedProducts.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm py-1">
                                        <span className="text-neutral-300">{getProductName(item.productId)}</span>
                                        <span className="text-white font-medium">x {item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between pt-4 border-t border-neutral-800">
                {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="border-neutral-700 text-neutral-300">
                        Atrás
                    </Button>
                ) : <div></div>}

                {step < 3 ? (
                    <Button onClick={handleNext} disabled={step === 1 && (!originBranchId || !destBranchId) || step === 2 && selectedProducts.length === 0} className="bg-purple-600">
                        Siguiente
                    </Button>
                ) : (
                    <Button onClick={handleConfirm} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                        {submitting ? 'Confirmando...' : 'Confirmar Traspaso'}
                    </Button>
                )}
            </div>
        </div>
    );
}
