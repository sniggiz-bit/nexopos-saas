
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCloseShift } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/utils/formatters';

interface CloseShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    shiftId: string;
}

export function CloseShiftModal({ isOpen, onClose, shiftId }: CloseShiftModalProps) {
    const [finalAmount, setFinalAmount] = useState('');
    const [closedShift, setClosedShift] = useState<any>(null);
    const { mutate: closeShift, isPending } = useCloseShift();
    const { toast } = useToast();

    const handleCloseShift = () => {
        const amount = parseFloat(finalAmount);
        if (isNaN(amount) || amount < 0) {
            toast({
                variant: 'destructive',
                title: 'Monto inválido',
                description: 'Por favor ingrese un monto final válido.',
            });
            return;
        }

        closeShift(
            {
                shiftId,
                userId: 'user-1', // TODO: Get from context
                finalAmount: amount,
            },
            {
                onSuccess: (data) => {
                    setClosedShift(data);
                    toast({
                        variant: 'success',
                        title: 'Caja Cerrada',
                        description: 'La caja se ha cerrado exitosamente.',
                    });
                },
                onError: (error: any) => {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: error.response?.data?.message || 'No se pudo cerrar la caja.',
                    });
                },
            }
        );
    };

    const handleCloseDialog = () => {
        setClosedShift(null);
        setFinalAmount('');
        onClose();
    };

    const handlePrintReport = () => {
        if (!closedShift?.textReport) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reporte Z</title>
                        <style>
                            body { font-family: 'Courier New', monospace; white-space: pre; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        ${closedShift.textReport}
                        <script>
                            window.onload = function() { window.print(); window.close(); }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (closedShift) {
        return (
            <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resumen de Cierre</DialogTitle>
                        <DialogDescription>
                            Detalle del cierre de caja.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Monto Esperado:</span>
                            <span>{formatPrice(Number(closedShift.shift.expectedAmount))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Monto Declarado:</span>
                            <span>{formatPrice(Number(closedShift.shift.finalAmount))}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-bold">Diferencia:</span>
                            <span className={`font-bold ${Number(closedShift.shift.difference) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {formatPrice(Number(closedShift.shift.difference))}
                            </span>
                        </div>

                        <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre overflow-auto max-h-60">
                            {closedShift.textReport}
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={handlePrintReport}>
                            🖨️ Imprimir Reporte Z
                        </Button>
                        <Button onClick={handleCloseDialog}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cerrar Caja</DialogTitle>
                    <DialogDescription>
                        Ingrese el monto total de dinero efectivo que hay en la caja.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="finalAmount" className="text-right text-sm font-medium">
                            Monto Efectivo
                        </label>
                        <Input
                            id="finalAmount"
                            type="number"
                            value={finalAmount}
                            onChange={(e) => setFinalAmount(e.target.value)}
                            className="col-span-3"
                            placeholder="0"
                            min="0"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleCloseShift} disabled={isPending || !finalAmount}>
                        {isPending ? 'Cerrando...' : 'Cerrar Caja'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
