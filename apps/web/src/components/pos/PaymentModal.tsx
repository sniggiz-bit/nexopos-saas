import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/utils/formatters';
import { CheckCircle2, XCircle } from 'lucide-react';
import { type CartItemData } from '@/context/CartContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePrintSettings, type PrintFormat } from '@/hooks/usePrintSettings';
import { printSaleAction } from './receipts/ReceiptRenderer';
import { useEffect, useState } from 'react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    items: CartItemData[];
    subtotal: number;
    tax: number;
    total: number;
    isProcessing: boolean;
    isSuccess: boolean;
    isError: boolean;
    saleResult?: any;
}

export function PaymentModal({
    isOpen,
    onClose,
    onConfirm,
    items,
    subtotal,
    tax,
    total,
    isProcessing,
    isSuccess,
    isError,
    saleResult,
}: PaymentModalProps) {
    const { autoPrint, setAutoPrint, defaultFormat, setDefaultFormat } = usePrintSettings();
    const [hasAttemptedAutoPrint, setHasAttemptedAutoPrint] = useState(false);

    // Auto-print effect
    useEffect(() => {
        if (isSuccess && saleResult && autoPrint && !hasAttemptedAutoPrint) {
            setHasAttemptedAutoPrint(true);
            printSaleAction(saleResult, defaultFormat);
        }
    }, [isSuccess, saleResult, autoPrint, defaultFormat, hasAttemptedAutoPrint]);

    // Reset auto-print state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setHasAttemptedAutoPrint(false);
        }
    }, [isOpen]);
    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-6 h-6" />
                            <DialogTitle>¡Venta exitosa!</DialogTitle>
                        </div>
                        <DialogDescription>
                            La venta se ha procesado correctamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted p-4 rounded-lg space-y-3 mb-4">
                        {saleResult?.dteFolio && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">Folio DTE:</span>
                                <span className="font-bold text-lg">#{saleResult.dteFolio}</span>
                            </div>
                        )}

                        {saleResult?.dtePdfUrl && !saleResult.dtePdfUrl.includes('ejemplo-mock') && (
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => window.open(saleResult.dtePdfUrl, '_blank')}
                            >
                                Ver Boleta (PDF)
                            </Button>
                        )}

                        {saleResult?.internalReceiptUrl && (
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => {
                                    const fullUrl = `http://localhost:3000${saleResult.internalReceiptUrl}`;
                                    window.open(fullUrl, '_blank');
                                }}
                            >
                                Ver Ticket Interno (PDF)
                            </Button>
                        )}

                        <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => printSaleAction(saleResult, defaultFormat)}
                        >
                            Imprimir Ticket ({defaultFormat})
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button onClick={onClose} className="w-full">Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (isError) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="w-6 h-6" />
                            <DialogTitle>Error al procesar la venta</DialogTitle>
                        </div>
                        <DialogDescription>
                            Hubo un problema al procesar la venta. Por favor, intenta nuevamente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                        <Button onClick={onConfirm}>Reintentar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Pago</DialogTitle>
                    <DialogDescription>
                        Revisa los detalles de la venta antes de confirmar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Productos ({items.length})</h4>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex justify-between text-sm"
                                >
                                    <span className="text-muted-foreground">
                                        {item.name} × {item.quantity}
                                    </span>
                                    <span>{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground italic">
                            <span>Neto aprox.</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground italic">
                            <span>IVA (19%)</span>
                            <span>{formatPrice(tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <div className="flex flex-col">
                                <span>Total</span>
                                <span className="text-[10px] font-normal text-muted-foreground uppercase">IVA Incluido</span>
                            </div>
                            <span className="text-primary text-2xl">{formatPrice(total)}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="auto-print">Imprimir al finalizar</Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Dispara la impresión automáticamente tras el éxito
                                </p>
                            </div>
                            <Switch
                                id="auto-print"
                                checked={autoPrint}
                                onChange={(e: any) => setAutoPrint(e.target.checked)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="print-format">Formato de impresión</Label>
                            <Select
                                value={defaultFormat}
                                onValueChange={(value: string) => setDefaultFormat(value as PrintFormat)}
                            >
                                <SelectTrigger id="print-format" className="h-8">
                                    <SelectValue placeholder="Seleccionar formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="80mm">Ticket 80mm</SelectItem>
                                    <SelectItem value="50mm">Ticket 50mm</SelectItem>
                                    <SelectItem value="A4">Boleta A4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button onClick={onConfirm} disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
