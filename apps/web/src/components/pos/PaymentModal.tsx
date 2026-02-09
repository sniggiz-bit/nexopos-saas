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
import { type CartItemData } from './CartItem';

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
}: PaymentModalProps) {
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
                    <DialogFooter>
                        <Button onClick={onClose}>Cerrar</Button>
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
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IVA (19%)</span>
                            <span>{formatPrice(tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(total)}</span>
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
