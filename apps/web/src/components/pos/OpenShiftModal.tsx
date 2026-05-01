import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
    Wallet, LogIn, Store, AlertCircle, Coins,
    Building2, User, Lock, Eye, EyeOff, ChevronDown,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface OpenShiftModalProps {
    isOpen: boolean;
}

interface UserOption {
    id: string;
    email: string;
    name: string | null;
    role: string;
    branchId: string | null;
    branch?: { id: string; name: string } | null;
}

const PRESET_AMOUNTS = [0, 10000, 20000, 50000, 100000];

export function OpenShiftModal({ isOpen }: OpenShiftModalProps) {
    const [initialAmount, setInitialAmount] = useState('0');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const { mutate: openShift, isPending } = useOpenShift();
    const { toast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: tenantUsers = [], isLoading: isLoadingUsers } = useQuery<UserOption[]>({
        queryKey: ['users', user?.tenantId],
        queryFn: async () => {
            const r = await apiClient.get(`/users?tenantId=${user?.tenantId}`);
            return r.data;
        },
        enabled: !!user?.tenantId && isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const selectedUser = tenantUsers.find(u => u.id === selectedUserId) ?? null;

    const handleOpenShift = async () => {
        const amount = parseFloat(initialAmount);
        if (isNaN(amount) || amount < 0) {
            toast({ variant: 'destructive', title: 'Monto inválido', description: 'Ingresa un monto inicial válido.' });
            return;
        }
        if (!selectedUser) {
            setVerifyError('Selecciona un usuario para abrir el turno.');
            return;
        }
        if (!password) {
            setVerifyError('Ingresa la contraseña del usuario seleccionado.');
            return;
        }

        setIsVerifying(true);
        setVerifyError('');

        try {
            const loginResp = await apiClient.post('/auth/login', {
                email: selectedUser.email,
                password,
            });
            const authedUser = loginResp.data.user;

            const branchId = authedUser.branchId ?? selectedUser.branchId;
            const tenantId = user?.tenantId;

            if (!branchId) {
                setVerifyError('El usuario no tiene sucursal asignada. Configúrala en el panel de administración.');
                setIsVerifying(false);
                return;
            }
            if (!tenantId) {
                setVerifyError('Error de sesión. Por favor recarga la página.');
                setIsVerifying(false);
                return;
            }

            openShift(
                { branchId, userId: authedUser.id, tenantId, initialAmount: amount },
                {
                    onSuccess: (newShift) => {
                        // Update the key the PosPage watches (admin may have branchId = null → '')
                        queryClient.setQueryData(['current-shift', user?.branchId ?? ''], newShift);
                        toast({
                            variant: 'success',
                            title: '¡Caja Iniciada!',
                            description: `Turno abierto por ${authedUser.name || authedUser.email} con $${amount.toLocaleString('es-CL')} de base`,
                        });
                        setPassword('');
                        setSelectedUserId('');
                        setVerifyError('');
                    },
                    onError: async (error: any) => {
                        const message = error.response?.data?.message || '';
                        if (message.includes('already an open shift')) {
                            // Fetch the existing shift and sync both query keys
                            try {
                                const { data: existingShift } = await apiClient.get(`/shifts/current/${branchId}`);
                                if (existingShift) {
                                    queryClient.setQueryData(['current-shift', branchId], existingShift);
                                    queryClient.setQueryData(['current-shift', user?.branchId ?? ''], existingShift);
                                    toast({ title: 'Turno Ya Abierto', description: 'Sincronizado correctamente.' });
                                }
                            } catch {
                                queryClient.refetchQueries({ queryKey: ['current-shift'] });
                            }
                        } else {
                            toast({ variant: 'destructive', title: 'Error al Abrir Caja', description: message || 'No se pudo abrir la caja. Intenta nuevamente.' });
                        }
                    },
                }
            );
        } catch (e: any) {
            if (e.response?.status === 401) {
                setVerifyError('Contraseña incorrecta. Inténtalo de nuevo.');
            } else {
                setVerifyError(e.response?.data?.message || 'Error al verificar credenciales. Intenta nuevamente.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const isLoading = isPending || isVerifying;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) navigate('/dashboard'); }}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-2xl">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-7 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-10">
                        <Wallet size={110} />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="bg-white/20 w-11 h-11 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md">
                            <Store className="text-white" size={22} />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Apertura de Caja</DialogTitle>
                        <p className="text-indigo-100 text-sm mt-1">
                            Selecciona el cajero y verifica su identidad para iniciar el turno.
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-7 space-y-5">
                    {/* User selector */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <User size={13} className="text-indigo-500" />
                            Cajero / Usuario
                        </div>
                        <div className="relative">
                            <select
                                value={selectedUserId}
                                onChange={(e) => { setSelectedUserId(e.target.value); setVerifyError(''); }}
                                disabled={isLoadingUsers}
                                className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all appearance-none disabled:opacity-50"
                            >
                                <option value="">{isLoadingUsers ? 'Cargando usuarios...' : '-- Seleccionar usuario --'}</option>
                                {tenantUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.email}{u.branch?.name ? ` · ${u.branch.name}` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Selected user info chip */}
                        {selectedUser && (
                            <div className="flex items-center gap-2.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                        {selectedUser.name || selectedUser.email}
                                    </p>
                                    {selectedUser.branch ? (
                                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                            <Building2 size={9} /> {selectedUser.branch.name}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <AlertCircle size={9} /> Sin sucursal asignada
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <Lock size={13} className="text-indigo-500" />
                            Contraseña
                        </div>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setVerifyError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleOpenShift()}
                                placeholder="Ingresa tu contraseña"
                                autoFocus
                                className="pr-10 h-11 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-950 transition-all rounded-xl"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {verifyError && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                <AlertCircle size={12} className="shrink-0" /> {verifyError}
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <Coins size={13} className="text-amber-500" />
                            Monto de Apertura (Base)
                        </div>

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
                                type="number"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(e.target.value)}
                                className="pl-10 h-14 text-2xl font-bold border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-950 transition-all rounded-xl shadow-sm"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleOpenShift}
                        disabled={isLoading || !selectedUserId || !password || initialAmount === ''}
                        className="h-14 w-full text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 rounded-xl"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{isVerifying ? 'Verificando credenciales...' : 'Abriendo turno...'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <LogIn size={20} />
                                <span>Verificar y Abrir Turno</span>
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
