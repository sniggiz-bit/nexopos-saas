import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useQuotes } from '../../hooks/useQuotesQuery';
import { useConvertQuote } from '../../hooks/useQuotes';
import { Eye, Plus, ShoppingCart, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/formatters';

export function QuotesPage() {
    const { data: quotesData, isLoading, isError, refetch } = useQuotes();
    const quotes = Array.isArray(quotesData) ? quotesData : [];
    const convertQuote = useConvertQuote();
    const navigate = useNavigate();
    const [convertingId, setConvertingId] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Intl.DateTimeFormat('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(dateString));
        } catch (_e) {
            return 'Fecha inválida';
        }
    };

    const handleConvert = async (id: string) => {
        if (convertingId) return;
        if (!confirm('¿Está seguro de convertir esta cotización en una venta pre-seleccionada?')) {
            return;
        }

        setConvertingId(id);
        try {
            await convertQuote.mutateAsync(id);
            refetch();
        } catch (_error) {
            // error shown by useConvertQuote hook toast
        } finally {
            setConvertingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cotizaciones</h1>
                        <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                            Gestiona y realiza seguimiento de las cotizaciones emitidas a tus clientes
                        </p>
                    </div>
                    <Button 
                        onClick={() => navigate('/dashboard/quotes/new')} 
                        className="bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold shadow-[0_0_15px_rgba(0,153,204,0.2)] hover:shadow-[0_0_25px_rgba(0,153,204,0.4)] transition-all duration-200"
                    >
                        <Plus className="w-4 h-4 mr-2 stroke-[3]" />
                        Nueva Cotización
                    </Button>
                </div>

                <div className="rounded-xl overflow-hidden bg-card border border-border">
                    <table className="min-w-full divide-y divide-border">
                        <thead style={{ background: 'hsl(var(--background))' }}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground/[0.5]">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#0099CC] border-t-transparent rounded-full animate-spin" />
                                            <span>Cargando cotizaciones...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-red-400">
                                        Error al cargar cotizaciones. <button onClick={() => refetch()} className="underline font-bold hover:text-red-300">Reintentar</button>
                                    </td>
                                </tr>
                            ) : !quotes || quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground/[0.4]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 text-muted-foreground" />
                                            <span>No se encontraron cotizaciones</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                quotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/[0.85]">{formatDate(quote.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/[0.85]">{quote.customer?.name || 'Cliente Casual'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground/[0.95] tabular-nums">{formatPrice(quote.total)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                                                quote.status === 'DRAFT'
                                                    ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    : quote.status === 'SENT'
                                                    ? 'bg-[#0099CC]/10 text-[#0099CC] border-[#0099CC]/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' // ACCEPTED
                                            }`}>
                                                {quote.status === 'DRAFT' ? 'Borrador' : quote.status === 'SENT' ? 'Emitida' : 'Vendida'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => navigate(`/dashboard/quotes/${quote.id}/print`)}
                                                className="text-[#0099CC] hover:text-white inline-flex items-center p-2 rounded-lg hover:bg-[#0099CC]/10 transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {quote.status !== 'ACCEPTED' && (
                                                <button
                                                    onClick={() => handleConvert(quote.id)}
                                                    className="text-emerald-400 hover:text-white inline-flex items-center p-2 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Convertir a Venta"
                                                    disabled={!!convertingId}
                                                >
                                                    {convertingId === quote.id
                                                        ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                        : <ShoppingCart className="w-4 h-4" />
                                                    }
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
