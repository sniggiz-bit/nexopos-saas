import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useSales } from '../../hooks/useSales';
import { Sale } from '../../api/sales';
import { FileText, Eye } from 'lucide-react';
import { Card } from '../../components/ui/card';

export function SalesHistoryPage() {
    const { data: sales, isLoading } = useSales();

    // Calculate total sales amount
    const totalSales = sales?.reduce((acc, sale) => acc + sale.total, 0) || 0;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    };

    const getPaymentMethodsLabel = (payments: any[]) => {
        if (!payments || payments.length === 0) return 'N/A';
        const labels: Record<string, string> = {
            CASH: 'Efectivo',
            CARD: 'Tarjeta',
            TRANSFER: 'Transferencia',
            DEBIT: 'Débito',
            CREDITO: 'Crédito',
        };
        return payments.map(p => labels[p.paymentMethod] || p.paymentMethod).join(', ');
    };

    const getStatusBadge = (status?: string) => {
        if (!status || status === 'PENDING') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Pendiente
                </span>
            );
        }
        if (status === 'SUCCESS' || status === 'EMITTED') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Exitoso
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Error
            </span>
        );
    };

    const handleViewPdf = (pdfUrl: string) => {
        // Check if it's a mock URL
        if (pdfUrl.includes('ejemplo-mock')) {
            alert('Esta es una venta de prueba. Configure un token real de Lioren en Configuración para generar boletas electrónicas válidas.');
            return;
        }
        // For internal receipts, prepend API base URL
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const fullUrl = pdfUrl.startsWith('/api/')
            ? `${apiUrl}${pdfUrl}`
            : pdfUrl;
        window.open(fullUrl, '_blank');
    };

    const isPdfAvailable = (sale: Sale) => {
        // PDF is available if URL exists and is not a mock URL
        return (sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock')) || !!sale.internalReceiptUrl;
    };

    const getPdfUrl = (sale: Sale): string | null => {
        // Prefer DTE PDF if available and not mock
        if (sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock')) {
            return sale.dtePdfUrl;
        }
        // Otherwise use internal receipt
        return sale.internalReceiptUrl || null;
    };

    const getPdfButtonLabel = (sale: Sale): string => {
        if (sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock')) {
            return 'Ver Boleta';
        }
        return 'Ver Ticket';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
                </div>

                {/* Summary Card */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Total de Ventas
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatCurrency(totalSales)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {sales?.length || 0} {sales?.length === 1 ? 'venta' : 'ventas'} registradas
                            </p>
                        </div>
                        <div className="p-4 bg-blue-100 rounded-lg">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </Card>

                {/* Sales Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Folio DTE
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Método de Pago
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        Cargando ventas...
                                    </td>
                                </tr>
                            ) : !sales || sales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron ventas
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => {
                                    const pdfUrl = getPdfUrl(sale);
                                    return (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(sale.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {sale.dteFolio ? (
                                                    <span className="font-medium">#{sale.dteFolio}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Pendiente</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(sale.total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {getPaymentMethodsLabel(sale.payments || [])}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(sale.dteStatus)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => pdfUrl && handleViewPdf(pdfUrl)}
                                                    disabled={!isPdfAvailable(sale)}
                                                    className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    title={
                                                        !pdfUrl
                                                            ? 'PDF no disponible'
                                                            : sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock')
                                                                ? 'Ver Boleta Electrónica'
                                                                : 'Ver Ticket Interno'
                                                    }
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    {getPdfButtonLabel(sale)}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
