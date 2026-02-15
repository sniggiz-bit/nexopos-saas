import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuote } from '@/api/quotes';
import { Quote } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { useQuotePdf } from '@/hooks/useQuotes';

export function QuotePrintPage() {
    const { id } = useParams<{ id: string }>();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const generatePdf = useQuotePdf();

    useEffect(() => {
        if (id) {
            getQuote(id)
                .then(setQuote)
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!id) return;
        try {
            const blob = await generatePdf.mutateAsync(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cotizacion-${quote?.id || id}.pdf`;
            a.click();
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (!quote) return <div className="p-8 text-center text-red-500">Cotización no encontrada</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Actions - Hidden on print */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="outline" onClick={() => navigate('/dashboard/quotes')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <div className="space-x-2">
                        <Button variant="outline" onClick={handleDownload} disabled={generatePdf.isPending}>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PDF
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                        </Button>
                    </div>
                </div>

                {/* Quote Document */}
                <div className="bg-white shadow-xl p-12 rounded-lg print:shadow-none print:p-0">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">COTIZACIÓN</h1>
                            <p className="text-gray-500">ID: {quote.id}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg">NexoPOS</p>
                            <p className="text-gray-600">Fecha: {new Date(quote.createdAt).toLocaleDateString()}</p>
                            <p className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {quote.status === 'ACCEPTED' ? 'VENDIDA' : 'PENDIENTE'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-12 border-t border-b py-6">
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Para:</p>
                            <p className="font-bold text-lg">{quote.customer?.name || 'Cliente Casual'}</p>
                            {quote.customer?.rut && <p className="text-gray-600">RUT: {quote.customer.rut}</p>}
                            {quote.customer?.address && <p className="text-gray-600">{quote.customer.address}</p>}
                            {quote.customer?.phone && <p className="text-gray-600">Tel: {quote.customer.phone}</p>}
                        </div>
                    </div>

                    <table className="w-full mb-12">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="text-left py-4 px-2 font-bold uppercase text-xs text-gray-400">Descripción</th>
                                <th className="text-right py-4 px-2 font-bold uppercase text-xs text-gray-400">Precio</th>
                                <th className="text-center py-4 px-2 font-bold uppercase text-xs text-gray-400">Cantidad</th>
                                <th className="text-right py-4 px-2 font-bold uppercase text-xs text-gray-400">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50">
                                    <td className="py-4 px-2">{item.product?.name || 'Producto'}</td>
                                    <td className="py-4 px-2 text-right">{formatPrice(item.price)}</td>
                                    <td className="py-4 px-2 text-center">{item.quantity}</td>
                                    <td className="py-4 px-2 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(quote.total / 1.19)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IVA (19%)</span>
                                <span>{formatPrice(quote.total - (quote.total / 1.19))}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                                <span>TOTAL</span>
                                <span>{formatPrice(quote.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 border-t pt-8 text-center text-sm text-gray-400">
                        <p>Gracias por su preferencia.</p>
                        <p>Esta cotización tiene una validez de 15 días.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
