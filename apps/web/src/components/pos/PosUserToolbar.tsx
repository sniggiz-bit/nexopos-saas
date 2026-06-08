import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Wifi, WifiOff, Clock, Printer } from 'lucide-react';
import { Shift } from '@/api/shifts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrintSettingsPanel } from './PrintSettingsPanel';
import { useQzTray } from '@/hooks/useQzTray';


const ROLE_LABELS: Record<string, string> = {
    TENANT_ADMIN: 'Administrador',
    MANAGER:      'Gerente',
    CASHIER:      'Cajero',
    SUPER_ADMIN:  'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
    TENANT_ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    MANAGER:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
    CASHIER:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    SUPER_ADMIN:  'bg-red-500/20 text-red-300 border-red-500/30',
};

interface PosUserToolbarProps {
    currentShift: Shift | null | undefined;
    branchName?: string;
}

export function PosUserToolbar({ currentShift, branchName }: PosUserToolbarProps) {
    const { user }    = useAuth();
    const navigate    = useNavigate();
    const [now, setNow]               = useState(new Date());
    const [isOnline, setIsOnline]     = useState(navigator.onLine);
    const [showPrintSettings, setShowPrintSettings] = useState(false);
    const { isConnected: isQzConnected } = useQzTray();

    useEffect(() => {
        const tick = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(tick);
    }, []);

    useEffect(() => {
        const onOnline  = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });

    const shiftElapsed = currentShift
        ? formatDistanceToNow(new Date(currentShift.startTime), { locale: es, addSuffix: false })
        : null;

    const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : '';
    const roleColor = user?.role ? ROLE_COLORS[user.role] ?? 'bg-slate-500/20 text-slate-300' : '';
    const canGoToDashboard = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

    const initials = (user?.name || user?.email || '?').charAt(0).toUpperCase();

    return (
        <div className="h-11 flex items-center justify-between px-4 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 shrink-0 z-30">

            {/* Left: Logo + Branch */}
            <div className="flex items-center gap-3 min-w-0">
                <Logo variant="full" mode="dark" className="h-6" />
                {branchName && (
                    <>
                        <span className="text-slate-700 select-none">·</span>
                        <span className="text-slate-400 text-xs font-medium truncate max-w-[160px]">
                            {branchName}
                        </span>
                    </>
                )}
            </div>

            {/* Center: Clock + shift elapsed */}
            <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                <span className="text-slate-100 font-mono font-bold text-sm tracking-wider tabular-nums">
                    {timeStr}
                </span>
                <span className="text-slate-500 text-xs capitalize hidden sm:inline">
                    {dateStr}
                </span>
                {shiftElapsed && (
                    <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px] font-semibold tabular-nums">
                            {shiftElapsed}
                        </span>
                    </div>
                )}
            </div>

            {/* Right: Online indicator + print settings + user + dashboard link */}
            <div className="flex items-center gap-2">
                <div title={isOnline ? 'En línea' : 'Sin conexión'}>
                    {isOnline
                        ? <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                        : <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    }
                </div>

                {/* Botón de configuración de impresora */}
                <div className="relative">
                    <button
                        onClick={() => setShowPrintSettings(s => !s)}
                        title="Configuración de impresión"
                        className={[
                            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
                            showPrintSettings
                                ? 'bg-slate-700 text-slate-200'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                        ].join(' ')}
                    >
                        <Printer className="w-3.5 h-3.5" />
                        {/* Indicador QZ */}
                        <span className={[
                            'w-1.5 h-1.5 rounded-full -mt-2 -mr-1',
                            isQzConnected ? 'bg-emerald-400' : 'bg-red-500',
                        ].join(' ')} />
                    </button>

                    {/* Popover de configuración */}
                    {showPrintSettings && (
                        <>
                            {/* Overlay para cerrar */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowPrintSettings(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-80 z-50 shadow-2xl rounded-xl border border-border bg-background">
                                <PrintSettingsPanel compact />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                    {/* Avatar */}
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                        {initials}
                    </div>
                    {/* Name + role */}
                    <div className="hidden sm:flex flex-col items-start leading-none">
                        <span className="text-slate-200 text-xs font-semibold truncate max-w-[100px]">
                            {user?.name || user?.email}
                        </span>
                        <Badge className={`text-[9px] px-1.5 py-0 h-4 mt-0.5 border font-semibold ${roleColor}`}>
                            {roleLabel}
                        </Badge>
                    </div>
                </div>

                {canGoToDashboard && (
                    <button
                        onClick={() => navigate('/dashboard')}
                        title="Ir al Panel de Control"
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs ml-1"
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Panel</span>
                    </button>
                )}
            </div>
        </div>
    );
}
