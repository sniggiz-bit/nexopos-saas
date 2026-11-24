import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Wifi, WifiOff, Clock, Printer, Maximize } from 'lucide-react';
import { Shift } from '@/api/shifts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrintSettingsPanel } from './PrintSettingsPanel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { useWebSerialPrinter } from '@/hooks/useWebSerialPrinter';


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
    const { isConnected: isWebSerialConnected } = useWebSerialPrinter();
    const { useWebSerial, defaultFormat } = usePrintSettings();
    const directMode = useWebSerial && defaultFormat !== 'A4';

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
            <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <Logo variant="full" mode="dark" className="h-6" />
                {branchName && (
                    <>
                        <span className="hidden select-none text-slate-700 sm:inline">·</span>
                        <span className="max-w-[96px] truncate text-[10px] font-medium leading-tight text-slate-400 sm:max-w-[160px] sm:text-xs">
                            {branchName}
                        </span>
                    </>
                )}
            </div>

            {/* Center: Clock + shift elapsed */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex">
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

                <Popover open={showPrintSettings} onOpenChange={setShowPrintSettings}>
                    <PopoverTrigger asChild>
                        <button type="button" title="Configuración de impresión" aria-label="Configuración de impresión" className={'flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' + (showPrintSettings ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')}>
                            <Printer className="h-3.5 w-3.5" />
                            <span className={'-mr-1 -mt-2 h-1.5 w-1.5 rounded-full ' + (directMode ? isWebSerialConnected ? 'bg-emerald-400' : 'bg-amber-400' : 'bg-cyan-400')} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent onFocusOutside={event => { if (document.getElementById('print-iframe')) event.preventDefault(); }} align="end" sideOffset={8} collisionPadding={8} aria-label="Configuración de impresión" className="flex max-h-[min(680px,var(--radix-popover-content-available-height))] w-[400px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl p-0 shadow-2xl">
                        <PrintSettingsPanel compact onClose={() => setShowPrintSettings(false)} />
                    </PopoverContent>
                </Popover>

                {/* Pantalla completa */}
                <button
                    onClick={() => {
                        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
                        else document.exitFullscreen().catch(()=>{});
                    }}
                    title="Pantalla completa"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                    <Maximize className="w-3.5 h-3.5" />
                </button>

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
