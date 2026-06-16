import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuote, sendQuoteEmail } from '@/api/quotes';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Download, Mail, Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import { useQuotePdf } from '@/hooks/useQuotes';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function QuotePrintPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [quote, setQuote] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const generatePdf = useQuotePdf();
    const { data: tenant } = useTenant(user?.tenantId);

    // Email Modal States
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    useEffect(() => {
        if (id) {
            getQuote(id)
                .then((data) => {
                    setQuote(data);
                    if (data?.customer?.email) {
                        setEmailRecipient(data.customer.email);
                    }
                })
                .catch(() => setQuote(null))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handlePrint = () => window.print();

    const handleDownload = async () => {
        if (!id) return;
        try {
            const blob = await generatePdf.mutateAsync(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cotizacion-${quote?.number || id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (_e) {
            // error handled by hook toast
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !emailRecipient) return;

        setIsSendingEmail(true);
        try {
            await sendQuoteEmail(id, emailRecipient, emailMessage);
            toast.success('Cotización enviada por correo exitosamente');
            setIsEmailModalOpen(false);
            setEmailMessage('');
            // Reload quote to show updated status (SENT)
            getQuote(id).then(setQuote).catch(() => {});
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al enviar la cotización');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        try {
            return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
        } catch (_e) {
            return dateStr;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando cotización...</div>;
    if (!quote) return <div className="p-8 text-center text-red-500">Cotización no encontrada</div>;

    const tenantInitial = (tenant?.name || 'N').charAt(0).toUpperCase();
    
    // Prices are IVA-inclusive. Compute totals from items directly.
    const total = quote.items.reduce((sum: number, item: any) =>
        sum + (item.total ?? item.price * Number(item.quantity)), 0);
    const subtotal = Math.round(total / 1.19);
    const tax = total - subtotal;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-4">

                {/* Toolbar — hidden on print */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="outline" onClick={() => navigate('/dashboard/quotes')} className="border-slate-300 hover:bg-slate-50 text-slate-700 bg-white">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEmailModalOpen(true)} className="border-slate-300 hover:bg-slate-50 text-slate-700 bg-white">
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar por Email
                        </Button>
                        <Button variant="outline" onClick={handleDownload} disabled={generatePdf.isPending} className="border-slate-300 hover:bg-slate-50 text-slate-700 bg-white">
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PDF
                        </Button>
                        <Button onClick={handlePrint} className="bg-[#0099CC] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold shadow-sm">
                            <Printer className="w-4 h-4 mr-2 stroke-[3]" />
                            Imprimir
                        </Button>
                    </div>
                </div>

                {/* Document */}
                <div className="bg-white shadow-xl rounded-lg print:shadow-none print:rounded-none overflow-hidden border border-slate-200 print:border-none">

                    {/* Header */}
                    <div className="p-10 pb-6">
                        <div className="flex justify-between items-start gap-8">

                            {/* Left: business info + logo */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-[#0099CC] rounded-xl flex items-center justify-center shrink-0 print:bg-[#0099CC]">
                                    <span className="text-2xl font-black text-white">{tenantInitial}</span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 leading-tight">{tenant?.name || ''}</p>
                                    {tenant?.rut && <p className="text-sm text-gray-500 mt-0.5">RUT: {tenant.rut}</p>}
                                    {tenant?.giro && <p className="text-sm text-gray-500">{tenant.giro}</p>}
                                    {tenant?.address && <p className="text-sm text-gray-500">{tenant.address}</p>}
                                    {tenant?.phone && <p className="text-sm text-gray-500">Tel: {tenant.phone}</p>}
                                </div>
                            </div>

                            {/* Right: quote metadata */}
                            <div className="text-right shrink-0">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">COTIZACIÓN</h1>
                                {quote.number && (
                                    <p className="text-lg font-bold text-[#0099CC] mt-1">{quote.number}</p>
                                )}
                                <div className="mt-2 space-y-0.5">
                                    <p className="text-sm text-gray-500">Fecha: {formatDate(quote.issueDate || quote.createdAt)}</p>
                                    {quote.validUntil && (
                                        <p className="text-sm text-gray-500">Válida hasta: {formatDate(quote.validUntil)}</p>
                                    )}
                                </div>
                                <span className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                    quote.status === 'ACCEPTED'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : quote.status === 'SENT'
                                        ? 'bg-[#0099CC]/10 text-[#0099CC] border-[#0099CC]/20'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                    {quote.status === 'ACCEPTED' ? 'VENDIDA' : quote.status === 'SENT' ? 'EMITIDA' : 'BORRADOR'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer block */}
                    <div className="mx-10 border-t border-slate-100" />
                    <div className="px-10 py-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Cotización para</p>
                        <p className="text-base font-bold text-gray-900">{quote.customer?.name || 'Cliente Casual'}</p>
                        {quote.customer?.rut && <p className="text-sm text-gray-500">RUT: {quote.customer.rut}</p>}
                        {quote.customer?.address && <p className="text-sm text-gray-500">{quote.customer.address}</p>}
                        {quote.customer?.phone && <p className="text-sm text-gray-500">Tel: {quote.customer.phone}</p>}
                        {quote.customer?.email && <p className="text-sm text-gray-500">{quote.customer.email}</p>}
                    </div>

                    {/* Items table */}
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#0099CC] text-white print:bg-[#0099CC]">
                                <th className="text-left py-3 px-10 text-xs font-semibold uppercase tracking-wider">Descripción</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider">Precio Unit.</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider">Cant.</th>
                                <th className="text-right py-3 px-10 text-xs font-semibold uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((item: any, i: number) => (
                                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="py-3 px-10 text-sm text-gray-800">
                                        {item.productName || item.product?.name || 'Producto'}
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-600">{formatPrice(item.price)}</td>
                                    <td className="py-3 px-4 text-center text-sm text-gray-600">{Number(item.quantity)}</td>
                                    <td className="py-3 px-10 text-right text-sm font-semibold text-gray-900">
                                        {formatPrice(item.total ?? item.price * Number(item.quantity))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="px-10 py-8 flex justify-end">
                        <div className="w-72 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal (neto)</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>IVA (19%)</span>
                                <span>{formatPrice(tax)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-black text-gray-900">
                                <span>TOTAL</span>
                                <span className="text-[#0099CC]">{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {quote.notes && (
                        <>
                            <div className="mx-10 border-t border-gray-100" />
                            <div className="px-10 py-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Notas</p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="bg-slate-50 border-t border-slate-100 px-10 py-5 text-center">
                        <p className="text-xs text-gray-400">Esta cotización tiene validez de 15 días desde la fecha de emisión.</p>
                        <p className="text-xs text-gray-300 mt-1">Documento generado por nexopos.cl</p>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent className="max-w-md bg-card border border-border text-foreground shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">Enviar Cotización por Correo</DialogTitle>
                        <DialogDescription className="text-sm text-gray-400">
                            Envía esta cotización directamente al correo de tu cliente. Se adjuntará el documento en formato PDF.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSendEmail} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs font-semibold text-gray-400">Correo Electrónico Destinatario</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={emailRecipient}
                                onChange={(e) => setEmailRecipient(e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className="w-full bg-card border-border rounded-xl focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none text-foreground placeholder-slate-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="message" className="text-xs font-semibold text-gray-400">Mensaje Personalizado (Opcional)</Label>
                            <Textarea
                                id="message"
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                placeholder="Escribe un mensaje que acompañará a la cotización..."
                                rows={4}
                                className="w-full bg-card border-border rounded-xl focus:border-[#0099CC] focus:ring-1 focus:ring-[#0099CC] outline-none text-foreground placeholder-slate-500 text-sm"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-border gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="text-gray-400 hover:text-foreground hover:bg-muted font-medium text-sm rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSendingEmail || !emailRecipient}
                                className="bg-[#0099CC] text-[#0B0F1A] font-bold rounded-xl hover:bg-[#00BCE0] hover:shadow-[0_0_15px_rgba(0,153,204,0.3)] transition-all disabled:opacity-50"
                            >
                                {isSendingEmail ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Enviar Correo
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
