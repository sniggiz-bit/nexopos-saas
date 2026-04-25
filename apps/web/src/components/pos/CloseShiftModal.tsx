import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCloseShift } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Calculator, Printer, CheckCircle2, AlertTriangle, ArrowRight, DollarSign, Receipt } from 'lucide-react';

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
    const { user } = useAuth();

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

        if (!user?.id) {
            toast({
                variant: 'destructive',
                title: 'Error de Sesión',
                description: 'No se pudo identificar al usuario. Reintente.',
            });
            return;
        }

        closeShift(
            {
                shiftId,
                userId: user.id,
                finalAmount: amount,
            },
            {
                onSuccess: (data) => {
                    setClosedShift(data);
                    toast({
                        variant: 'success',
                        title: '¡Caja Cerrada!',
                        description: 'El turno ha finalizado correctamente.',
                    });
                },
                onError: (error: any) => {
                    toast({
                        variant: 'destructive',
                        title: 'Error al cerrar caja',
                        description: error.response?.data?.message || 'Ocurrió un error inesperado.',
                    });
                },
            }
        );
    };

    const handleCloseDialog = () => {
        setClosedShift(null);
        setFinalAmount('');
        onClose();
        // Redirect or refresh might be needed here depending on UX
    };

    const handlePrintReport = () => {
        if (!closedShift?.textReport) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reporte Z - NexoPOS</title>
                        <style>
                            @page { size: 80mm auto; margin: 0; }
                            body { 
                                font-family: 'Courier New', Courier, monospace; 
                                white-space: pre; 
                                font-size: 13px; 
                                padding: 10px;
                                color: #000;
                            }
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
        const diff = Number(closedShift.shift.difference);
        return (
            <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl rounded-2xl">
                    <div className="bg-emerald-600 p-8 text-white flex flex-col items-center">
                        <div className="bg-white/20 p-3 rounded-full mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Cierre Exitoso</DialogTitle>
                        <p className="text-emerald-100 mt-1 uppercase tracking-widest text-[10px] font-bold">Turno Finalizado</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Monto Esperado</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(Number(closedShift.shift.expectedAmount))}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Monto Declarado</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(Number(closedShift.shift.finalAmount))}</p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl flex items-center justify-between ${diff === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' : diff < 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700'}`}>
                            <div className="flex items-center gap-3">
                                {diff === 0 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                                <div>
                                    <p className="text-xs font-bold uppercase">Diferencia de Caja</p>
                                    <p className="text-lg font-black">{formatPrice(diff)}</p>
                                </div>
                            </div>
                            {diff !== 0 && (
                                <span className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded uppercase tracking-tighter">
                                    {diff < 0 ? 'Faltante' : 'Sobrante'}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                <Receipt size={14} />
                                Vista Previa Reporte Z
                            </div>
                            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono leading-tight max-h-[200px] overflow-y-auto custom-scrollbar border border-slate-800 shadow-inner">
                                {closedShift.textReport}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-12 border-2 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                                onClick={handlePrintReport}
                            >
                                <Printer size={18} className="mr-2" />
                                Imprimir Z
                            </Button>
                            <Button 
                                className="flex-1 h-12 bg-slate-900 hover:bg-black text-white font-bold"
                                onClick={handleCloseDialog}
                            >
                                Salir del Sistema
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-2xl">
                <div className="bg-gradient-to-br from-red-600 to-rose-700 p-8 text-white relative">
                    <div className="absolute top-4 right-4 opacity-10">
                        <LogOut size={120} />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <Calculator className="text-white" size={24} />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Cierre de Caja</DialogTitle>
                        <p className="text-red-100 text-sm mt-1">Ingresa el recuento final de efectivo para terminar el turno.</p>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <DollarSign size={14} className="text-emerald-500" />
                            Efectivo Total en Caja
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-red-500 transition-colors">
                                <span className="text-xl font-semibold">$</span>
                            </div>
                            <Input
                                id="finalAmount"
                                type="number"
                                value={finalAmount}
                                onChange={(e) => setFinalAmount(e.target.value)}
                                autoFocus
                                className="pl-10 h-16 text-2xl font-bold border-2 border-slate-200 dark:border-slate-800 focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-slate-950 transition-all rounded-xl shadow-sm"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                <Receipt size={18} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Turno Actual</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">ID: {shiftId.split('-')[0]}...</p>
                            </div>
                            <ArrowRight className="ml-auto text-slate-300" size={16} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button 
                            variant="ghost" 
                            onClick={onClose} 
                            disabled={isPending}
                            className="flex-1 h-14 font-bold text-slate-500 hover:text-slate-900"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCloseShift}
                            disabled={isPending || !finalAmount}
                            className="flex-[2] h-14 text-lg font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 rounded-xl"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Cerrando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <LogOut size={20} />
                                    <span>Finalizar Turno</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
