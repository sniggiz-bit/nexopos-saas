
import { X, ArrowDown, ArrowUp, ArrowRight, RotateCcw, Truck } from 'lucide-react';
import type { Product, MovementType } from '../../api/types';
import { useQuery } from '@tanstack/react-query';
import { getKardex } from '../../api/inventory';

interface InventoryKardexModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export function InventoryKardexModal({ isOpen, onClose, product }: InventoryKardexModalProps) {
    const { data: movements, isLoading } = useQuery({
        queryKey: ['kardex', product?.id],
        queryFn: () => product ? getKardex(product.id) : Promise.resolve([]),
        enabled: !!product && isOpen,
    });

    const getIcon = (type: MovementType) => {
        switch (type) {
            case 'SALE': return <ArrowUp className="w-4 h-4 text-red-500" />;
            case 'PURCHASE': return <Truck className="w-4 h-4 text-green-500" />;
            case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-yellow-500" />;
            case 'RETURN': return <ArrowDown className="w-4 h-4 text-green-500" />;
            case 'INITIAL': return <RotateCcw className="w-4 h-4 text-blue-500" />;
            default: return <ArrowRight className="w-4 h-4 text-gray-500" />;
        }
    };

    const getLabel = (type: MovementType) => {
        switch (type) {
            case 'SALE': return 'Venta';
            case 'PURCHASE': return 'Compra';
            case 'ADJUSTMENT': return 'Ajuste';
            case 'RETURN': return 'Devolución';
            case 'INITIAL': return 'Inventario Inicial';
            default: return type;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        Kardex: {product?.name}
                    </DialogTitle>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-500">Cargando movimientos...</div>
                    ) : !movements || movements.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No hay movimientos registrados.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {movements.map((move) => (
                                    <tr key={move.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(move.createdAt).toLocaleString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center gap-2">
                                                {getIcon(move.type)}
                                                <span>{getLabel(move.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {move.reference || '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${move.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {move.quantity > 0 ? '+' : ''}{Number(move.quantity)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                            {Number(move.balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {move.user?.name || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper component for Title to match code style, though simplistic
function DialogTitle({ children, className }: { children: React.ReactNode, className?: string }) {
    return <h3 className={className}>{children}</h3>;
}
