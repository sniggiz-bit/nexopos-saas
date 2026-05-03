import { useState, useEffect, useRef } from 'react';
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { useCreateProduct } from '../../hooks/useCreateProduct';
import { useUpdateProduct } from '../../hooks/useUpdateProduct';
import { useCategories } from '../../hooks/useCategories';
import { useBrands } from '../../hooks/useBrands';
import toast from 'react-hot-toast';
import type { Product } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Product | null;
}

export function ProductFormModal({ isOpen, onClose, initialData }: ProductFormModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        price: '',
        costPrice: '',
        stock: '0',
        minStock: '0',
        unitType: 'UNIT' as 'UNIT' | 'WEIGHT',
        categoryId: '',
        brandId: '',
        image: '',
        isActive: true,
    });
    const [priceTiers, setPriceTiers] = useState<{ minQuantity: string; unitPrice: string }[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wasOpenRef = useRef(false);

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const { data: categories } = useCategories(user?.tenantId ?? '');
    const { data: brands } = useBrands(user?.tenantId ?? '');

    useEffect(() => {
        // Solo inicializar cuando el modal recién se abre (transición cerrado → abierto).
        // Ignorar cambios de initialData mientras el modal ya está abierto (background refetches).
        if (!isOpen) {
            wasOpenRef.current = false;
            return;
        }
        if (wasOpenRef.current) return;
        wasOpenRef.current = true;

        if (initialData) {
            setFormData({
                name: initialData.name,
                sku: initialData.sku || '',
                barcode: initialData.barcode || '',
                price: initialData.price.toString(),
                costPrice: initialData.costPrice?.toString() || '',
                stock: initialData.stock?.toString() || '0',
                minStock: initialData.minStock?.toString() || '0',
                unitType: initialData.unitType,
                categoryId: initialData.category?.id || '',
                brandId: initialData.brand?.id || '',
                image: initialData.image || '',
                isActive: initialData.isActive,
            });
            setPriceTiers(initialData.priceTiers?.map(t => ({
                minQuantity: t.minQuantity.toString(),
                unitPrice: t.unitPrice.toString()
            })) || []);
        } else {
            setFormData({
                name: '',
                sku: '',
                barcode: '',
                price: '',
                costPrice: '',
                stock: '0',
                minStock: '0',
                unitType: 'UNIT',
                categoryId: '',
                brandId: '',
                image: '',
                isActive: true,
            });
            setPriceTiers([]);
        }
    }, [initialData, isOpen]);

    const handleImageFile = async (file: File) => {
        if (!file) return;
        setUploadingImage(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await apiClient.post<{ url: string }>('/uploads/image', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Error al subir la imagen';
            toast.error(msg);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.price) {
            toast.error('Nombre y precio son obligatorios');
            return;
        }

        const parsedTiers = priceTiers
            .filter(t => t.minQuantity && t.unitPrice)
            .map(t => ({
                minQuantity: parseInt(t.minQuantity),
                unitPrice: parseInt(t.unitPrice)
            }));

        const basePrice = parseInt(formData.price);

        if (parsedTiers.some(t => t.unitPrice >= basePrice)) {
            toast.error('El precio en los tramos mayoristas debe ser menor al Precio de Venta base.');
            return;
        }

        try {
            if (initialData) {
                await updateProduct.mutateAsync({
                    id: initialData.id,
                    name: formData.name,
                    sku: formData.sku || undefined,
                    barcode: formData.barcode || undefined,
                    price: parseInt(formData.price),
                    costPrice: parseInt(formData.costPrice) || 0,
                    minStock: parseInt(formData.minStock) || 0,
                    stock: parseInt(formData.stock) || 0,
                    unitType: formData.unitType,
                    categoryId: formData.categoryId || undefined,
                    brandId: formData.brandId || undefined,
                    image: formData.image || undefined,
                    isActive: formData.isActive,
                    priceTiers: parsedTiers.length > 0 ? parsedTiers : undefined,

                });
                onClose();
            } else {
                await createProduct.mutateAsync({
                    name: formData.name,
                    sku: formData.sku || undefined,
                    barcode: formData.barcode || undefined,
                    price: parseInt(formData.price),
                    costPrice: parseInt(formData.costPrice) || 0,
                    minStock: parseInt(formData.minStock) || 0,
                    initialStock: parseInt(formData.stock) || 0,
                    unitType: formData.unitType,
                    categoryId: formData.categoryId || undefined,
                    brandId: formData.brandId || undefined,
                    image: formData.image || undefined,
                    isActive: formData.isActive,
                    tenantId: user?.tenantId ?? '',
                    branchId: user?.branchId ?? undefined,
                    priceTiers: parsedTiers.length > 0 ? parsedTiers : undefined,
                });

                toast.success('Producto creado exitosamente');
                onClose();
                // Reset form
                setFormData({
                    name: '',
                    sku: '',
                    barcode: '',
                    price: '',
                    costPrice: '',
                    stock: '0',
                    minStock: '0',
                    unitType: 'UNIT',
                    categoryId: '',
                    brandId: '',
                    image: '',
                    isActive: true,
                });
                setPriceTiers([]);
            }
        } catch (error: any) {
            const action = initialData ? 'actualizar' : 'crear';
            toast.error(error.response?.data?.message || `Error al ${action} producto`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {initialData ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Producto *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Coca Cola 1.5L"
                            required
                        />
                    </div>

                    {/* SKU and Barcode */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SKU
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código de Barras
                            </label>
                            <input
                                type="text"
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: 7790001234567"
                            />
                        </div>
                    </div>

                    {/* Price and Cost Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio de Venta (CLP) *
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1500"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio de Costo (CLP)
                            </label>
                            <input
                                type="number"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1000"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Wholesale Prices Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-800">Precios por Volumen / Mayorista</h3>
                            <button
                                type="button"
                                onClick={() => setPriceTiers([...priceTiers, { minQuantity: '', unitPrice: '' }])}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                + Agregar Tramo
                            </button>
                        </div>

                        {priceTiers.length === 0 ? (
                            <p className="text-xs text-gray-500">No hay tramos de precio configurados. El producto usará el precio base.</p>
                        ) : (
                            <div className="space-y-2">
                                {priceTiers.map((tier, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="2"
                                                placeholder="Cant. Min. (ej: 5)"
                                                value={tier.minQuantity}
                                                onChange={(e) => {
                                                    const newTiers = [...priceTiers];
                                                    newTiers[index].minQuantity = e.target.value;
                                                    setPriceTiers(newTiers);
                                                }}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Precio Unitario (ej: 1200)"
                                                value={tier.unitPrice}
                                                onChange={(e) => {
                                                    const newTiers = [...priceTiers];
                                                    newTiers[index].unitPrice = e.target.value;
                                                    setPriceTiers(newTiers);
                                                }}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newTiers = priceTiers.filter((_, i) => i !== index);
                                                setPriceTiers(newTiers);
                                            }}
                                            className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-full"
                                            title="Eliminar Tramo"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unit Type Toggle */}
                    <div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.unitType === 'WEIGHT'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        unitType: e.target.checked ? 'WEIGHT' : 'UNIT',
                                    })
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Venta a Granel (permite cantidades decimales como 0.5 kg)
                            </span>
                        </label>
                    </div>

                    {/* Category and Brand */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Sin categoría</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Marca
                            </label>
                            <select
                                value={formData.brandId}
                                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Sin marca</option>
                                {brands?.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagen del Producto
                        </label>
                        <div className="flex items-start gap-3">
                            {/* Preview */}
                            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
                                {formData.image
                                    ? <img src={formData.image} alt="preview" className="w-full h-full object-cover rounded-lg" />
                                    : <ImageIcon className="w-7 h-7 text-gray-300" />
                                }
                            </div>

                            <div className="flex-1 space-y-2">
                                {/* File picker */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageFile(file);
                                        e.target.value = '';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                >
                                    {uploadingImage
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                                        : <><Upload className="w-4 h-4" /> Subir imagen</>
                                    }
                                </button>

                                {/* URL manual como fallback */}
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 focus:ring-1 focus:ring-blue-400"
                                    placeholder="O pega una URL externa..."
                                />
                                {formData.image && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Quitar imagen
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stock and Min Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Actual (Inventario)
                            </label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                                min="0"
                            />
                            {initialData && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Para ajustar el stock, use el módulo de inventario.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Mínimo (Alerta)
                            </label>
                            <input
                                type="number"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="10"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Producto activo</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createProduct.isPending || updateProduct.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createProduct.isPending || updateProduct.isPending
                                ? 'Guardando...'
                                : initialData
                                    ? 'Guardar Cambios'
                                    : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
