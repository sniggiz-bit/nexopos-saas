import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOpenShift } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Wallet, LogIn, Store, AlertCircle, Coins, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface OpenShiftModalProps {
    isOpen: boolean;
}

const PRESET_AMOUNTS = [0, 10000, 20000, 50000, 100000];

export function OpenShiftModal({ isOpen }: OpenShiftModalProps) {
    const [initialAmount, setInitialAmount] = useState('0');
    const { mutate: openShift, isPending } = useOpenShift();
    const { toast } = useToast();
    const { user } = useAuth();

    const { data: branches = [] } = useQuery<{ id: string; name: string }[]>({
        queryKey: ['branches', user?.tenantId],
        queryFn: async () => {
            const r = await apiClient.get('/branches');
            return r.data;
        },
        enabled: !!user?.tenantId,
        staleTime: 10 * 60 * 1000,
    });

    const branchName = branches.find(b => b.id === user?.branchId)?.name;

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
                description: 'No se pudo obtener la información del usuario. Verifica que tienes una sucursal asignada.',
            });
            return;
        }

        openShift(
            { branchId, userId, tenantId, initialAmount: amount },
            {
                onSuccess: () => {
                    toast({
                        variant: 'success',
                        title: '¡Caja Iniciada!',
                        description: `Turno abierto con $${amount.toLocaleString('es-CL')} de base`,
                    });
                    setInitialAmount('0');
                },
                onError: (error: any) => {
                    const message = error.response?.data?.message || '';
                    if (message.includes('already an open shift')) {
                        toast({
                            title: 'Turno Ya Abierto',
                            description: 'Ya existe un turno abierto para esta sucursal.',
                        });
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Error al Abrir Caja',
                            description: message || 'No se pudo abrir la caja. Intenta nuevamente.',
                        });
                    }
                },
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleOpenShift();
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-2xl">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-10">
                        <Wallet size={120} />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <Store className="text-white" size={24} />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Apertura de Caja</DialogTitle>
                        <p className="text-indigo-100 text-sm mt-1">
                            ¡Hola, <span className="font-semibold text-white">{user?.name || 'Vendedor'}</span>! Inicia tu jornada laboral.
                        </p>
                        {branchName && (
                            <div className="flex items-center gap-1.5 mt-2 text-indigo-200 text-xs">
                                <Building2 size={12} />
                                <span>{branchName}</span>
                            </div>
                        )}
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <Coins size={14} className="text-amber-500" />
                            Monto de Apertura (Base)
                        </div>

                        {/* Preset amounts */}
                        <div className="grid grid-cols-5 gap-2">
                            {PRESET_AMOUNTS.map(amount => (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() => setInitialAmount(String(amount))}
                                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                                        initialAmount === String(amount)
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'
                                    }`}
                                >
                                    {amount === 0 ? '$0' : `$${(amount / 1000).toFixed(0)}K`}
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <span className="text-xl font-semibold">$</span>
                            </div>
                            <Input
                                id="amount"
                                type="number"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="pl-10 h-16 text-2xl font-bold border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-950 transition-all rounded-xl shadow-sm"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl flex gap-3 items-start">
                            <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                El monto inicial es el efectivo disponible en caja al comenzar el turno. Favor verificar antes de confirmar.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleOpenShift}
                        disabled={isPending || initialAmount === ''}
                        className="h-14 w-full text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 rounded-xl"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Abriendo...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <LogIn size={20} />
                                <span>Abrir Turno</span>
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
