import { useState } from 'react';
import { X, Plus, Minus, PackagePlus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { toast } from 'react-hot-toast';
import type { Product } from '../../api/types';

interface StockAdjustModalProps {
    product: Product;
    branchId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function StockAdjustModal({ product, branchId, onClose, onSuccess }: StockAdjustModalProps) {
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');
    const [mode, setMode] = useState<'add' | 'subtract'>('add');
    const [isLoading, setIsLoading] = useState(false);

    const qty = Number(quantity) || 0;
    const finalQty = mode === 'add' ? qty : -qty;
    const newStock = product.stock + finalQty;

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!qty || qty <= 0) {
            toast.error('Ingresa una cantidad válida');
            return;
        }
        if (mode === 'subtract' && qty > product.stock) {
            toast.error(`No puedes restar más de ${product.stock} unidades disponibles`);
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/inventory/adjust', {
                productId: product.id,
                branchId,
                quantity: finalQty,
                note: note || undefined,
            });
            toast.success(
                mode === 'add'
                    ? `+${qty} ${product.unitType === 'WEIGHT' ? 'kg' : 'uds'} agregados a ${product.name}`
                    : `-${qty} ${product.unitType === 'WEIGHT' ? 'kg' : 'uds'} descontados de ${product.name}`
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al ajustar el stock');
        } finally {
            setIsLoading(false);
        }
    };

    const unit = product.unitType === 'WEIGHT' ? 'kg' : 'uds';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PackagePlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Ajustar Stock</h2>
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">{product.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Current stock */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="text-sm text-gray-500">Stock actual</span>
                        <span className="text-lg font-bold text-gray-900">{product.stock} {unit}</span>
                    </div>

                    {/* Mode toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('add')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                                mode === 'add'
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            Agregar
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('subtract')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                                mode === 'subtract'
                                    ? 'bg-red-50 border-red-400 text-red-700'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <Minus className="w-4 h-4" />
                            Descontar
                        </button>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad ({unit})
                        </label>
                        <input
                            type="number"
                            min={product.unitType === 'WEIGHT' ? '0.001' : '1'}
                            step={product.unitType === 'WEIGHT' ? '0.001' : '1'}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold text-center"
                            placeholder="0"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Ej: Compra proveedor, Merma, Corrección..."
                        />
                    </div>

                    {/* Preview */}
                    {qty > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-sm text-blue-700">Nuevo stock:</span>
                            <span className={`text-lg font-black ${newStock < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                                {newStock} {unit}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !qty || qty <= 0}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 ${
                                mode === 'add'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {isLoading ? 'Guardando...' : mode === 'add' ? `Agregar ${qty || ''} ${unit}` : `Descontar ${qty || ''} ${unit}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
