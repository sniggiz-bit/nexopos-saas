import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Search, Loader2 } from 'lucide-react';
import { api } from '../../../api/client';
import { Badge } from '../../../components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NewTransferModal } from './components/NewTransferModal';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';

interface Transfer {
    id: string;
    originBranch: { name: string };
    destinationBranch: { name: string };
    requestedBy: { name: string };
    status: string;
    createdAt: string;
    items: Array<{
        id: string;
        quantity: number;
        product: { name: string; sku: string };
    }>;
}

export function TransfersPage() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTransfers = async () => {
        try {
            const response = await api.get('/transfers');
            setTransfers(response.data);
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
    }, []);

    const filteredTransfers = transfers.filter((transfer) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            transfer.originBranch.name.toLowerCase().includes(searchLower) ||
            transfer.destinationBranch.name.toLowerCase().includes(searchLower) ||
            transfer.items.some(item => item.product.name.toLowerCase().includes(searchLower))
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-5">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Traspasos de Inventario
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Gestiona y visualiza los movimientos de stock entre sucursales
                        </p>
                    </div>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Traspaso
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por sucursal o producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Fecha y Hora
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Origen / Destino
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Total Items
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Realizado por
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                            <p className="mt-2 text-sm">Cargando traspasos...</p>
                                        </td>
                                    </tr>
                                ) : filteredTransfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <ArrowLeftRight className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 font-medium">No hay traspasos de stock</p>
                                            <p className="text-sm mt-1">Acá se mostrará el historial de movimiento entre sucursales.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransfers.map((transfer) => (
                                        <tr key={transfer.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {format(new Date(transfer.createdAt), "d MMM, yyyy", { locale: es })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(transfer.createdAt), "HH:mm")}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-md line-clamp-1 max-w-[120px]" title={transfer.originBranch.name}>{transfer.originBranch.name}</span>
                                                    <ArrowLeftRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded-md font-medium line-clamp-1 max-w-[120px]" title={transfer.destinationBranch.name}>{transfer.destinationBranch.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {transfer.items.reduce((sum, item) => sum + Number(item.quantity), 0)} un.
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ({transfer.items.length} prod. distintos)
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {transfer.requestedBy?.name || 'Sistema'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={getStatusColor(transfer.status)} variant="secondary">
                                                    {transfer.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <NewTransferModal
                    isOpen={isNewModalOpen}
                    onClose={() => setIsNewModalOpen(false)}
                    onSuccess={() => {
                        setIsNewModalOpen(false);
                        fetchTransfers();
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
