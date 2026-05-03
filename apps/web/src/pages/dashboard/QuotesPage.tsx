import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useQuotes } from '../../hooks/useQuotesQuery';
import { useConvertQuote } from '../../hooks/useQuotes';
import { Eye, Plus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/formatters';

export function QuotesPage() {
    const { data: quotesData, isLoading, isError, refetch } = useQuotes();
    const quotes = Array.isArray(quotesData) ? quotesData : [];
    const convertQuote = useConvertQuote();
    const navigate = useNavigate();

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
        if (!confirm('¿Está seguro de convertir esta cotización en una venta pre-seleccionada?')) {
            return;
        }

        try {
            await convertQuote.mutateAsync(id);
            refetch();
        } catch (_error) {
            console.error('Error converting quote:', _error);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
                    <Button onClick={() => navigate('/dashboard/quotes/new')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Cotización
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Cargando cotizaciones...</td></tr>
                            ) : isError ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-red-500">Error al cargar cotizaciones. <button onClick={() => refetch()} className="underline">Reintentar</button></td></tr>
                            ) : !quotes || quotes.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron cotizaciones</td></tr>
                            ) : (
                                quotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(quote.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.customer?.name || 'Cliente Casual'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatPrice(quote.total)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                                quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800' // ACCEPTED
                                                }`}>
                                                {quote.status === 'DRAFT' ? 'Borrador' : quote.status === 'SENT' ? 'Emitida' : 'Vendida'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => navigate(`/dashboard/quotes/${quote.id}/print`)}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center p-2 rounded-full hover:bg-blue-50"
                                                title="Ver Detalles"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {quote.status !== 'ACCEPTED' && (
                                                <button
                                                    onClick={() => handleConvert(quote.id)}
                                                    className="text-green-600 hover:text-green-900 inline-flex items-center p-2 rounded-full hover:bg-green-50"
                                                    title="Convertir a Venta"
                                                    disabled={convertQuote.isPending}
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
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
