import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { SalesHistoryTable } from '../../components/dashboard/SalesHistoryTable';
import { useSales } from '../../hooks/useSales';
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatCLP } from '../../services/sales.service';
import type { SaleStatus } from '../../services/sales.service';
import { emitNotaCredito } from '../../api/sales';
import {
    TrendingUp, CalendarDays,
    Store, RefreshCw, ShoppingCart, XCircle,
} from 'lucide-react';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    cyan:    '#00D4FF',
    cyanA:   (a: number) => `rgba(0,212,255,${a})`,
    green:   '#34D399',
    greenA:  (a: number) => `rgba(52,211,153,${a})`,
    red:     '#F87171',
    redA:    (a: number) => `rgba(248,113,113,${a})`,
    violet:  '#A78BFA',
    violetA: (a: number) => `rgba(167,139,250,${a})`,
    card: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
    text: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted-foreground))',
};

interface Filters {
    startDate: string;
    endDate:   string;
    branchId:  string;
    status:    SaleStatus | '';
}

function todayISO()         { return new Date().toISOString().slice(0, 10); }
function thirtyDaysAgoISO() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}

// ── Summary card ───────────────────────────────────────────────────────────────
interface SummaryCardProps {
    label:      string;
    value:      string;
    sub?:       string;
    icon:       React.ReactNode;
    accent:     string;
    accentAlpha:(a: number) => string;
}

function SummaryCard({ label, value, sub, icon, accent: _accent, accentAlpha }: SummaryCardProps) {
    return (
        <div className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden"
            style={{ background: accentAlpha(0.07), border: `1px solid ${accentAlpha(0.2)}` }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accentAlpha(0.35);
                (e.currentTarget as HTMLElement).style.boxShadow   = `0 0 20px ${accentAlpha(0.1)}`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accentAlpha(0.2);
                (e.currentTarget as HTMLElement).style.boxShadow   = '';
            }}>
            {/* glow orb */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${accentAlpha(0.12)} 0%, transparent 70%)` }} />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative z-10"
                style={{ background: accentAlpha(0.14), border: `1px solid ${accentAlpha(0.25)}` }}>
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accentAlpha(0.75) }}>
                    {label}
                </p>
                <p className="text-2xl font-black tabular-nums leading-tight" style={{ color: C.text }}>
                    {value}
                </p>
                {sub && <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{sub}</p>}
            </div>
        </div>
    );
}

// ── Input / Select shared styles ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    background: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    padding:     '7px 12px',
    fontSize:    '13px',
    color: 'hsl(var(--foreground))',
    outline:     'none',
    width:       '100%',
    colorScheme: 'normal',
};

// ── Page ───────────────────────────────────────────────────────────────────────
export function SalesHistoryPage() {
    const { user }  = useAuth();
    const { toast } = useToast();
    const [filters, setFilters] = useState<Filters>({
        startDate: thirtyDaysAgoISO(),
        endDate:   todayISO(),
        branchId:  '',
        status:    '',
    });

    const { data: salesRaw = [], isLoading, refetch, isFetching } = useSales({
        filters: {
            startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
            endDate:   filters.endDate   ? `${filters.endDate}T23:59:59`   : undefined,
            branchId:  filters.branchId  || undefined,
            tenantId:  user?.tenantId,
        },
    });

    const { branches } = useBranches();

    const { mutate: emitNC, isPending: isEmittingNC, variables: ncSaleId } = useMutation({
        mutationFn: (saleId: string) => emitNotaCredito(saleId),
        onSuccess: (data) => {
            if (data.success) {
                toast({ title: 'Nota de Crédito emitida', description: data.folio ? `Folio #${data.folio}` : 'DTE emitido exitosamente' });
                refetch();
            } else {
                toast({ variant: 'destructive', title: 'Error al emitir NC', description: data.error || 'No se pudo emitir la Nota de Crédito' });
            }
        },
        onError: () => toast({ variant: 'destructive', title: 'Error', description: 'No se pudo emitir la Nota de Crédito' }),
    });

    const sales          = useMemo(() => !filters.status ? salesRaw : salesRaw.filter(s => s.status === filters.status), [salesRaw, filters.status]);
    const totalRevenue   = useMemo(() => sales.filter(s => s.status === 'COMPLETED' && s.dteType !== 61).reduce((a, s) => a + s.total, 0), [sales]);
    const completedCount = useMemo(() => sales.filter(s => s.status === 'COMPLETED' && s.dteType !== 61).length, [sales]);
    const cancelledCount = useMemo(() => sales.filter(s => s.status === 'CANCELLED' || s.dteType === 61).length, [sales]);

    const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        setFilters(prev => ({ ...prev, [key]: value }));

    const reset = () => setFilters({ startDate: thirtyDaysAgoISO(), endDate: todayISO(), branchId: '', status: '' });

    return (
        <DashboardLayout>
            <div className="space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: C.text }}>Historial de Ventas</h1>
                        <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                            Consulta, filtra y descarga tus boletas y tickets de venta.
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 disabled:opacity-50"
                        style={{ background: C.cyanA(0.08), border: `1px solid ${C.cyanA(0.2)}`, color: C.cyan }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.14)}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.08)}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard
                        label="Ingresos (completadas)"
                        value={formatCLP(totalRevenue)}
                        sub={`${completedCount} ${completedCount === 1 ? 'venta' : 'ventas'}`}
                        icon={<TrendingUp className="w-5 h-5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyanA(0.7)})` }} />}
                        accent={C.cyan}
                        accentAlpha={C.cyanA}
                    />
                    <SummaryCard
                        label="Ventas completadas"
                        value={completedCount.toString()}
                        icon={<ShoppingCart className="w-5 h-5" style={{ color: C.green, filter: `drop-shadow(0 0 6px ${C.greenA(0.7)})` }} />}
                        accent={C.green}
                        accentAlpha={C.greenA}
                    />
                    <SummaryCard
                        label="Ventas anuladas"
                        value={cancelledCount.toString()}
                        icon={<XCircle className="w-5 h-5" style={{ color: C.red, filter: `drop-shadow(0 0 6px ${C.redA(0.7)})` }} />}
                        accent={C.red}
                        accentAlpha={C.redA}
                    />
                </div>

                {/* ── Filter Bar ── */}
                <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex flex-wrap gap-3 items-end">

                        {/* Desde */}
                        <div className="flex flex-col gap-1.5 min-w-[155px]">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: C.cyanA(0.75) }}>
                                <CalendarDays className="w-3 h-3" /> Desde
                            </label>
                            <input type="date" value={filters.startDate} max={filters.endDate || todayISO()}
                                onChange={e => set('startDate', e.target.value)} style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = C.cyanA(0.4))}
                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)')} />
                        </div>

                        {/* Hasta */}
                        <div className="flex flex-col gap-1.5 min-w-[155px]">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: C.cyanA(0.75) }}>
                                <CalendarDays className="w-3 h-3" /> Hasta
                            </label>
                            <input type="date" value={filters.endDate} min={filters.startDate} max={todayISO()}
                                onChange={e => set('endDate', e.target.value)} style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = C.cyanA(0.4))}
                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)')} />
                        </div>

                        {/* Sucursal */}
                        <div className="flex flex-col gap-1.5 min-w-[175px]">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: C.cyanA(0.75) }}>
                                <Store className="w-3 h-3" /> Sucursal
                            </label>
                            <select value={filters.branchId} onChange={e => set('branchId', e.target.value)}
                                style={{ ...inputStyle, appearance: 'none' as any }}>
                                <option value="" style={{ background: '#111622' }}>Todas las sucursales</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id} style={{ background: '#111622' }}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Estado */}
                        <div className="flex flex-col gap-1.5 min-w-[145px]">
                            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.cyanA(0.75) }}>
                                Estado
                            </label>
                            <select value={filters.status} onChange={e => set('status', e.target.value as SaleStatus | '')}
                                style={{ ...inputStyle, appearance: 'none' as any }}>
                                <option value="" style={{ background: '#111622' }}>Todos</option>
                                <option value="COMPLETED" style={{ background: '#111622' }}>Completada</option>
                                <option value="CANCELLED" style={{ background: '#111622' }}>Anulada</option>
                                <option value="PRE_SALE" style={{ background: '#111622' }}>Pre-venta</option>
                            </select>
                        </div>

                        {/* Limpiar */}
                        <button onClick={reset}
                            className="mt-auto px-4 py-[7px] rounded-xl text-[13px] font-medium transition-all duration-150"
                            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.color = C.text;
                                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--foreground) / 0.25)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))';
                                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                            }}>
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ── Table ── */}
                <SalesHistoryTable
                    sales={sales}
                    isLoading={isLoading}
                    onEmitNotaCredito={saleId => emitNC(saleId)}
                    emittingNcId={isEmittingNC ? ncSaleId : null}
                />
            </div>
        </DashboardLayout>
    );
}
