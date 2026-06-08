import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useCreateQuote } from '@/hooks/useQuotes';
import { useAuth } from '@/context/AuthContext';
import { CustomerSelector } from '@/components/dashboard/CustomerSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Printer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProductSearchCombobox } from '@/components/quotes/ProductSearchCombobox';
import { QuoteItemsTable } from '@/components/quotes/QuoteItemsTable';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function CreateQuotePage() {
    const { user } = useAuth();
    const { items, addItem, clearCart, totals } = useCart();
    const [customerId, setCustomerId] = useState<string>('');
    const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [validUntil, setValidUntil] = useState<string>(
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [quoteNumber, setQuoteNumber] = useState('');
    const [notes, setNotes] = useState('');

    const navigate = useNavigate();
    const { toast } = useToast();
    const createQuote = useCreateQuote();

    // Clear cart on mount to ensure we start fresh for a new quote
    useEffect(() => {
        clearCart();
    }, [clearCart]);

    const handleCreateQuote = async (openPdf = false) => {
        if (!customerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un cliente' });
            return;
        }
        if (items.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'La cotización está vacía' });
            return;
        }

        try {
            const result = await createQuote.mutateAsync({
                tenantId: user?.tenantId ?? '',
                customerId,
                issueDate,
                validUntil,
                notes: notes || undefined,
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.name,
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0
                }))
            });
            clearCart();
            if (openPdf && result?.id) {
                navigate(`/dashboard/quotes/${result.id}/print`);
            } else {
                navigate('/dashboard/quotes');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Error al crear cotización' });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full min-h-screen p-6">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate('/dashboard/quotes')} 
                            className="text-[rgba(180,195,220,0.6)] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Nueva Cotización</h1>
                            <p className="text-[rgba(180,195,220,0.5)] text-sm">Crea una nueva cotización para tu cliente</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => handleCreateQuote(false)} 
                            disabled={createQuote.isPending}
                            className="border-[rgba(0,212,255,0.2)] text-[rgba(210,225,245,0.85)] hover:bg-[#00D4FF]/5 hover:text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Borrador
                        </Button>
                        <Button 
                            onClick={() => handleCreateQuote(true)} 
                            disabled={createQuote.isPending}
                            className="bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Guardar y PDF
                        </Button>
                    </div>
                </div>

                {/* Main "Document" Card */}
                <Card className="max-w-5xl mx-auto w-full border-[rgba(0,212,255,0.12)] bg-[rgba(255,255,255,0.02)] border-t-4 border-t-[#00D4FF] shadow-[0_0_30px_rgba(0,212,255,0.05)]">
                    <CardHeader className="pb-6">
                        <div className="flex justify-between items-start gap-8">
                            {/* Client Section - Left */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <Label className="text-base font-semibold mb-2 block text-white">Cliente</Label>
                                    <CustomerSelector value={customerId} onChange={setCustomerId} />
                                </div>
                            </div>

                            {/* Metadata Section - Right */}
                            <div className="grid grid-cols-2 gap-4 w-[400px]">
                                <div className="space-y-2">
                                    <Label className="text-[rgba(210,225,245,0.8)]">Fecha de Emisión</Label>
                                    <Input
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="bg-[rgba(255,255,255,0.02)] border-[rgba(0,212,255,0.15)] text-white focus:border-[#00D4FF]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[rgba(210,225,245,0.8)]">Válido Hasta</Label>
                                    <Input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="bg-[rgba(255,255,255,0.02)] border-[rgba(0,212,255,0.15)] text-white focus:border-[#00D4FF]"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-[rgba(210,225,245,0.8)]">Número de Cotización (Opcional)</Label>
                                    <Input
                                        placeholder="QT-####"
                                        value={quoteNumber}
                                        onChange={(e) => setQuoteNumber(e.target.value)}
                                        className="bg-[rgba(255,255,255,0.02)] border-[rgba(0,212,255,0.15)] text-white focus:border-[#00D4FF]"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator className="bg-[rgba(0,212,255,0.08)]" />

                    <CardContent className="pt-8 space-y-8">
                        {/* Product Search Bar */}
                        <div className="space-y-2">
                            <Label className="text-base font-semibold text-white">Agregar Productos</Label>
                            <ProductSearchCombobox onSelect={(p) => addItem(p, 1)} />
                        </div>

                        {/* Items Table */}
                        <div className="min-h-[200px]">
                            <QuoteItemsTable />
                        </div>
                    </CardContent>

                    <Separator className="bg-[rgba(0,212,255,0.08)]" />

                    <CardFooter className="flex flex-col gap-8 pt-8 pb-10 bg-[rgba(0,212,255,0.02)] border-t border-[rgba(0,212,255,0.08)]">
                        <div className="flex w-full gap-12">
                            {/* Notes Section - Left */}
                            <div className="flex-1 space-y-2">
                                <Label className="text-base font-semibold flex items-center gap-2 text-white">
                                    <FileText className="w-4 h-4 text-[#00D4FF]" /> Notas o Condiciones Comerciales
                                </Label>
                                <Textarea
                                    placeholder="Ingrese notas adicionales, términos de pago, o condiciones de entrega..."
                                    className="min-h-[120px] resize-none bg-[rgba(255,255,255,0.02)] border-[rgba(0,212,255,0.15)] text-white focus:border-[#00D4FF]"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Financial Summary - Right */}
                            <div className="w-[300px] space-y-3">
                                <div className="flex justify-between text-[rgba(180,195,220,0.5)]">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between text-[rgba(180,195,220,0.5)]">
                                    <span>IVA (19%)</span>
                                    <span className="tabular-nums">${totals.tax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                {totals.totalDiscount > 0 && (
                                    <div className="flex justify-between text-emerald-400 font-medium">
                                        <span>Descuento</span>
                                        <span className="tabular-nums">-${totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                    </div>
                                )}
                                <Separator className="my-2 bg-[rgba(0,212,255,0.08)]" />
                                <div className="flex justify-between text-2xl font-bold text-[#00D4FF] text-glow-cyan">
                                    <span>TOTAL</span>
                                    <span className="tabular-nums">${totals.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}
