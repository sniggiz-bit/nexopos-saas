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
import { useOpenShift } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface OpenShiftModalProps {
    isOpen: boolean;
}

export function OpenShiftModal({ isOpen }: OpenShiftModalProps) {
    const [initialAmount, setInitialAmount] = useState('');
    const { mutate: openShift, isPending } = useOpenShift();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleOpenShift = () => {
        const amount = parseFloat(initialAmount);
        if (isNaN(amount) || amount < 0) {
            toast({
                variant: 'destructive',
                title: 'Monto inválido',
                description: 'Por favor ingrese un monto inicial válido.',
            });
            return;
        }

        const branchId = user?.branchId;
        const userId = user?.id;
        const tenantId = user?.tenantId;

        if (!branchId || !userId || !tenantId) {
            toast({
                variant: 'destructive',
                title: 'Error de Sesión',
                description: 'No se pudo obtener la información del usuario. Intente recargar.',
            });
            return;
        }

        openShift(
            {
                branchId,
                userId,
                tenantId,
                initialAmount: amount,
            },
            {
                onSuccess: () => {
                    toast({
                        variant: 'success',
                        title: 'Caja Abierta',
                        description: `La caja se ha abierto con $${amount}`,
                    });
                    setInitialAmount('');
                },
                onError: (error: any) => {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: error.response?.data?.message || 'No se pudo abrir la caja.',
                    });
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Abrir Caja</DialogTitle>
                    <DialogDescription>
                        Debe abrir la caja para comenzar a vender. Ingrese el monto inicial.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="amount" className="text-right text-sm font-medium">
                            Monto Inicial
                        </label>
                        <Input
                            id="amount"
                            type="number"
                            value={initialAmount}
                            onChange={(e) => setInitialAmount(e.target.value)}
                            className="col-span-3"
                            placeholder="0"
                            min="0"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleOpenShift} disabled={isPending || !initialAmount}>
                        {isPending ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
