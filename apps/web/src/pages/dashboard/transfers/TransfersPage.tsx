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
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'PENDING':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'CANCELLED':
                return 'bg-red-500/10 text-red-400 border border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-up">
                <div className="flex justify-between items-center border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Traspasos de Inventario
                        </h1>
                        <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                            Gestiona y visualiza los movimientos de stock entre sucursales
                        </p>
                    </div>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(0,153,204,0.2)] hover:shadow-[0_0_25px_rgba(0,153,204,0.4)] transition-all"
                    >
                        <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                        Nuevo Traspaso
                    </button>
                </div>

                <div className="rounded-xl overflow-hidden animate-fade-up bg-card border border-border">
                    <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/[0.4]" />
                            <input
                                type="text"
                                placeholder="Buscar por sucursal o producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#0099CC] focus:border-transparent outline-none placeholder:text-muted-foreground/[0.3] transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead style={{ background: 'hsl(var(--background))' }}>
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Fecha y Hora
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Origen / Destino
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Total Items
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Realizado por
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground/[0.5]">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0099CC]" />
                                            <p className="mt-2 text-sm">Cargando traspasos...</p>
                                        </td>
                                    </tr>
                                ) : filteredTransfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground/[0.5]">
                                            <div className="mx-auto w-12 h-12 bg-card border border-border rounded-full flex items-center justify-center mb-3">
                                                <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-foreground font-medium">No hay traspasos de stock</p>
                                            <p className="text-sm mt-1 text-muted-foreground/[0.4]">Acá se mostrará el historial de movimiento entre sucursales.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransfers.map((transfer) => (
                                        <tr key={transfer.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-foreground/[0.95]">
                                                    {format(new Date(transfer.createdAt), "d MMM, yyyy", { locale: es })}
                                                </p>
                                                <p className="text-xs text-muted-foreground/[0.4]">
                                                    {format(new Date(transfer.createdAt), "HH:mm")}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-foreground/[0.85] bg-card border border-border px-2.5 py-1 rounded-md line-clamp-1 max-w-[120px]" title={transfer.originBranch.name}>{transfer.originBranch.name}</span>
                                                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground/[0.4] flex-shrink-0" />
                                                    <span className="text-xs text-[#0099CC] bg-[#0099CC]/10 border border-[#0099CC]/20 px-2.5 py-1 rounded-md font-semibold line-clamp-1 max-w-[120px]" title={transfer.destinationBranch.name}>{transfer.destinationBranch.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-foreground/[0.95] font-bold">
                                                    {transfer.items.reduce((sum, item) => sum + Number(item.quantity), 0)} un.
                                                </div>
                                                <div className="text-xs text-muted-foreground/[0.4]">
                                                    ({transfer.items.length} prod. distintos)
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground/[0.5]">
                                                {transfer.requestedBy?.name || 'Sistema'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={`${getStatusColor(transfer.status)} border px-2.5 py-0.5`} variant="secondary">
                                                    {transfer.status === 'COMPLETED' ? 'Completado' : transfer.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
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
