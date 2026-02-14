
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useQuotes } from '../../hooks/useQuotesQuery';
import { useQuotePdf } from '../../hooks/useQuotes';
import { Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function QuotesPage() {
    const { data: quotes, isLoading } = useQuotes();
    const generatePdf = useQuotePdf();
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    };

    const handleViewPdf = async (id: string) => {
        try {
            const blob = await generatePdf.mutateAsync(id);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error generating PDF:', error);
            // toast.error('Error al generar PDF');
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
                            ) : !quotes || quotes.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron cotizaciones</td></tr>
                            ) : (
                                quotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(quote.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.customer?.name || 'Cliente Casual'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(quote.total)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                                quote.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800' // CONVERTED
                                                }`}>
                                                {quote.status === 'DRAFT' ? 'Borrador' : quote.status === 'ISSUED' ? 'Emitida' : 'Vendida'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleViewPdf(quote.id)}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                title="Ver PDF"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* Future: Add convert to sale button */}
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
