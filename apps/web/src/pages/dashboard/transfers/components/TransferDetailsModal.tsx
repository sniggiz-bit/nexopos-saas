import { X, ArrowLeftRight, Calendar, User, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../../../../components/ui/badge';

interface TransferItem {
    id: string;
    quantity: number;
    product: { name: string; sku: string | null };
}

interface Transfer {
    id: string;
    originBranch: { name: string };
    destinationBranch: { name: string };
    requestedBy: { name: string };
    status: string;
    createdAt: string;
    note?: string | null;
    items: TransferItem[];
}

interface TransferDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transfer: Transfer | null;
}

export function TransferDetailsModal({ isOpen, onClose, transfer }: TransferDetailsModalProps) {
    if (!isOpen || !transfer) return null;

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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Completado';
            case 'PENDING': return 'Pendiente';
            case 'CANCELLED': return 'Cancelado';
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card/[0.95] border border-border text-foreground backdrop-blur-md w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-up">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-muted/20">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-[#0099CC]/10 text-[#0099CC] rounded-lg">
                            <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Detalle del Traspaso</h2>
                            <p className="text-xs text-muted-foreground font-mono select-all">ID: {transfer.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Main Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10 p-4 rounded-xl border border-border/50">
                        <div className="space-y-3">
                            <div className="flex items-start space-x-2.5">
                                <ArrowLeftRight className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Flujo de Stock</span>
                                    <div className="flex items-center space-x-1.5 mt-0.5">
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-card border border-border rounded text-foreground">{transfer.originBranch.name}</span>
                                        <span className="text-xs text-muted-foreground">→</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-[#0099CC]/10 border border-[#0099CC]/20 text-[#0099CC] rounded">{transfer.destinationBranch.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2.5">
                                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fecha y Hora</span>
                                    <span className="text-sm font-medium mt-0.5 block">
                                        {format(new Date(transfer.createdAt), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start space-x-2.5">
                                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Solicitado por</span>
                                    <span className="text-sm font-medium mt-0.5 block">
                                        {transfer.requestedBy?.name || 'Sistema'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2.5">
                                <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estado</span>
                                    <Badge className={`${getStatusColor(transfer.status)} border px-2 py-0.5 text-xs font-semibold mt-1`} variant="secondary">
                                        {getStatusLabel(transfer.status)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Note if exists */}
                    {transfer.note && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                                <FileText className="w-3.5 h-3.5 mr-1 text-[#0099CC]" /> Nota / Observación
                            </h3>
                            <div className="p-3 bg-muted/20 border border-border rounded-xl text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {transfer.note}
                            </div>
                        </div>
                    )}

                    {/* Products Table */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Productos Traspasados
                        </h3>
                        <div className="border border-border rounded-xl overflow-hidden bg-card/50">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Producto</th>
                                        <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">SKU</th>
                                        <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border font-medium">
                                    {transfer.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/10">
                                            <td className="px-4 py-3 text-sm text-foreground">{item.product.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{item.product.sku || 'S/N'}</td>
                                            <td className="px-4 py-3 text-sm text-right text-foreground font-mono font-bold">{Number(item.quantity)} un.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-bold bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] rounded-xl hover:shadow-[0_0_15px_rgba(0,153,204,0.3)] transition-all"
                    >
                        Cerrar
                    </button>
                </div>

            </div>
        </div>
    );
}
