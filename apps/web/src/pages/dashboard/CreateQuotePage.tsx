import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useCreateQuote } from '@/hooks/useQuotes';
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function CreateQuotePage() {
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

    const handleCreateQuote = async (generatePdf: boolean = false) => {
        if (!customerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un cliente' });
            return;
        }
        if (items.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'La cotización está vacía' });
            return;
        }

        try {
            await createQuote.mutateAsync({
                tenantId: 'tenant-1',
                customerId,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }))
            });
            clearCart();
            toast({ variant: 'success', title: 'Cotización creada exitosamente' });
            navigate('/dashboard/quotes');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Error al crear cotización' });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50/50 min-h-screen p-6">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/quotes')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Nueva Cotización</h1>
                            <p className="text-muted-foreground text-sm">Crea una nueva cotización para tu cliente</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleCreateQuote(false)} disabled={createQuote.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Borrador
                        </Button>
                        <Button onClick={() => handleCreateQuote(true)} disabled={createQuote.isPending}>
                            <Printer className="w-4 h-4 mr-2" />
                            Guardar y PDF
                        </Button>
                    </div>
                </div>

                {/* Main "Document" Card */}
                <Card className="max-w-5xl mx-auto w-full shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="pb-6">
                        <div className="flex justify-between items-start gap-8">
                            {/* Client Section - Left */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <Label className="text-base font-semibold mb-2 block">Cliente</Label>
                                    <CustomerSelector value={customerId} onChange={setCustomerId} />
                                </div>
                            </div>

                            {/* Metadata Section - Right */}
                            <div className="grid grid-cols-2 gap-4 w-[400px]">
                                <div className="space-y-2">
                                    <Label>Fecha de Emisión</Label>
                                    <Input
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Válido Hasta</Label>
                                    <Input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Número de Cotización (Opcional)</Label>
                                    <Input
                                        placeholder="QT-####"
                                        value={quoteNumber}
                                        onChange={(e) => setQuoteNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-8 space-y-8">
                        {/* Product Search Bar */}
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">Agregar Productos</Label>
                            <ProductSearchCombobox onSelect={(p) => addItem(p, 1)} />
                        </div>

                        {/* Items Table */}
                        <div className="min-h-[200px]">
                            <QuoteItemsTable />
                        </div>
                    </CardContent>

                    <Separator />

                    <CardFooter className="flex flex-col gap-8 pt-8 pb-10 bg-gray-50/30">
                        <div className="flex w-full gap-12">
                            {/* Notes Section - Left */}
                            <div className="flex-1 space-y-2">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Notas o Condiciones Comerciales
                                </Label>
                                <Textarea
                                    placeholder="Ingrese notas adicionales, términos de pago, o condiciones de entrega..."
                                    className="min-h-[120px] resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Financial Summary - Right */}
                            <div className="w-[300px] space-y-3">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>IVA (19%)</span>
                                    <span>${totals.tax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                {totals.totalDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Descuento</span>
                                        <span>-${totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between text-2xl font-bold text-primary">
                                    <span>TOTAL</span>
                                    <span>${totals.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}
