import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import {
    Package, ShoppingCart, TrendingUp, AlertTriangle,
    Users, Truck, Store, FileText, ArrowUpRight,
    TrendingDown, Minus, Activity, DollarSign, Zap, Globe,
} from 'lucide-react';
import { NexoPosAccessButton } from '../../components/NexoPosAccessButton';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { formatPrice } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSales } from '../../api/sales';
import { getDashboardAnalytics } from '../../api/dashboard';
import { apiClient } from '../../api/client';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Title, Tooltip, Legend, Filler
);

// ── Color palette ──────────────────────────────────────────────────────────────
const CYAN       = '#00D4FF';
const CYAN_ALPHA = (a: number) => `rgba(0,212,255,${a})`;
const BG_CARD    = 'rgba(255,255,255,0.02)';
const BORDER     = 'rgba(0,212,255,0.1)';

export function DashboardOverviewPage() {
    const { user }                          = useAuth();
    const { data: stats, isLoading }        = useDashboardStats(user?.branchId || undefined);
    const { data: products }                = useProducts();

    const todayStr = new Date().toLocaleDateString('en-CA');
    const { data: todaySales } = useQuery({
        queryKey: ['sales', 'today', todayStr],
        queryFn: () => getSales({
            startDate: `${todayStr}T00:00:00`,
            endDate:   `${todayStr}T23:59:59`,
        }),
        enabled: !!user,
    });

    const { data: analytics } = useQuery({
        queryKey: ['dashboard', 'analytics'],
        queryFn: () => getDashboardAnalytics(user?.branchId || undefined),
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
    });

    const { data: dteStats } = useQuery({
        queryKey: ['dte-stats'],
        queryFn: async () => {
            const res = await apiClient.get('/dte-config/stats');
            return res.data as { totalAccepted: number; thisMonth: number; errorCount: number };
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000,
    });

    const { data: webOrders } = useQuery({
        queryKey: ['dashboard', 'web-orders'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>('/integrations/orders');
            return res.data;
        },
        enabled: !!user,
        staleTime: 60 * 1000,
    });

    const webOrdersPending = (webOrders || []).filter(
        o => o.status === 'PENDING' || (o.status !== 'PROCESSED' && o.status !== 'FAILED')
    ).length;
    const webOrdersTotal = webOrders?.length ?? 0;

    const { data: shiftSummary } = useQuery({
        queryKey: ['dashboard', 'current-shift-summary', user?.branchId],
        queryFn: async () => {
            if (!user?.branchId) return null;
            try {
                const shiftRes = await apiClient.get<any>(`/shifts/current/${user.branchId}`);
                const currentShift = shiftRes.data;
                if (!currentShift || !currentShift.id) {
                    return { active: false, paymentMethods: { EFECTIVO: 0, DEBITO: 0, CREDITO: 0, TRANSFERENCIA: 0 } };
                }
                const summaryRes = await apiClient.get<any>(`/shifts/summary/${currentShift.id}`);
                return {
                    active: true,
                    ...summaryRes.data,
                };
            } catch (err) {
                console.error('Error fetching shift summary for dashboard:', err);
                return { active: false, paymentMethods: { EFECTIVO: 0, DEBITO: 0, CREDITO: 0, TRANSFERENCIA: 0 } };
            }
        },
        enabled: !!user?.branchId,
        staleTime: 30 * 1000,
    });

    const lowStockProducts     = (products || []).filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock).slice(0, 10);
    const completedSalesToday  = (todaySales || []).filter(s => s.status === 'COMPLETED' && s.dteType !== 61);
    const totalToday           = completedSalesToday.reduce((sum, s) => sum + s.total, 0);
    const lowStockCount        = stats?.lowStockCount ?? 0;

    // ── Hourly bar chart ─────────────────────────────────────────────────────
    const hourlyLabels = Array.from({ length: 18 }, (_, i) => {
        const h = i + 6;
        return h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    });
    const hourlyValues = analytics?.salesByHour.slice(6, 24).map(h => h.total) ?? Array(18).fill(0);

    const barChartData = {
        labels: hourlyLabels,
        datasets: [{
            label: 'Ventas',
            data: hourlyValues,
            backgroundColor: hourlyValues.map(v =>
                v > 0 ? CYAN_ALPHA(0.7) : CYAN_ALPHA(0.1)
            ),
            borderColor: CYAN_ALPHA(0.9),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
        }],
    };

    const barChartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(11,15,26,0.95)',
                borderColor: CYAN_ALPHA(0.3),
                borderWidth: 1,
                titleColor: CYAN,
                bodyColor: 'rgba(210,225,245,0.8)',
                callbacks: { label: (ctx: any) => ` ${formatPrice(ctx.raw)}` },
            },
        },
        scales: {
            y: {
                ticks: { color: 'rgba(180,195,220,0.4)', callback: (v: any) => `$${(v / 1000).toFixed(0)}k`, font: { size: 10 } },
                grid:  { color: 'rgba(0,212,255,0.05)', drawBorder: false },
                border: { display: false },
            },
            x: {
                ticks: { color: 'rgba(180,195,220,0.4)', font: { size: 9 } },
                grid:  { display: false },
                border: { display: false },
            },
        },
    };

    const mc        = analytics?.monthComparison;
    const pctChange = mc?.pctChange;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-up">

                {/* ── Fila 1: KPI primarias grandes ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PrimaryKpiCard
                        title="Ventas Hoy"
                        value={formatPrice(stats?.salesToday || 0)}
                        sub={`${completedSalesToday.length} transacciones`}
                        icon={ShoppingCart}
                        accent={CYAN}
                        accentAlpha={CYAN_ALPHA}
                        trend={pctChange}
                        span={false}
                    />
                    <PrimaryKpiCard
                        title="Ingresos del Mes"
                        value={formatPrice(stats?.monthRevenue || 0)}
                        sub="mes en curso"
                        icon={TrendingUp}
                        accent="#A78BFA"
                        accentAlpha={(a) => `rgba(167,139,250,${a})`}
                        trend={pctChange}
                        span={false}
                    />
                    <PrimaryKpiCard
                        title="Total Productos"
                        value={stats?.totalProducts?.toString() || '0'}
                        sub="en catálogo"
                        icon={Package}
                        accent="#34D399"
                        accentAlpha={(a) => `rgba(52,211,153,${a})`}
                        span={false}
                    />
                    <PrimaryKpiCard
                        title="Stock Crítico"
                        value={lowStockCount.toString()}
                        sub={lowStockCount > 0 ? 'requieren atención' : 'sin alertas'}
                        icon={AlertTriangle}
                        accent={lowStockCount > 0 ? '#F59E0B' : '#34D399'}
                        accentAlpha={lowStockCount > 0
                            ? (a: number) => `rgba(245,158,11,${a})`
                            : (a: number) => `rgba(52,211,153,${a})`}
                        alert={lowStockCount > 0}
                        span={false}
                    />
                </div>

                {/* ── Fila 3: Chart + comparativa (Ubicado debajo de las primeras 4 tarjetas) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Comparativa mensual */}
                    <div className="rounded-2xl p-5 flex flex-col justify-between"
                        style={{ background: BG_CARD, border: BORDER.replace('0.1', '0.1') + ' solid', borderColor: BORDER }}>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: CYAN_ALPHA(0.1) }}>
                                    <TrendingUp className="w-3.5 h-3.5" style={{ color: CYAN }} />
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,212,255,0.5)' }}>
                                    Comparativa Mensual
                                </p>
                            </div>
                            <p className="text-3xl font-black tabular-nums leading-none mb-1"
                                style={{ color: 'rgba(210,225,245,0.95)', textShadow: `0 0 30px ${CYAN_ALPHA(0.15)}` }}>
                                {formatPrice(mc?.currentRevenue ?? 0)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(180,195,220,0.4)' }}>mes actual</p>
                        </div>

                        <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] mb-0.5" style={{ color: 'rgba(180,195,220,0.4)' }}>mes anterior</p>
                                    <p className="text-sm font-bold tabular-nums" style={{ color: 'rgba(210,225,245,0.7)' }}>
                                        {formatPrice(mc?.prevRevenue ?? 0)}
                                    </p>
                                </div>
                                {pctChange !== null && pctChange !== undefined ? (
                                    <TrendBadge value={pctChange} />
                                ) : (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                        style={{ background: 'rgba(180,195,220,0.08)', color: 'rgba(180,195,220,0.4)' }}>
                                        <Minus size={10} /> Sin datos
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bar chart ventas por hora */}
                    <div className="lg:col-span-2 rounded-2xl p-5"
                        style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: CYAN_ALPHA(0.1) }}>
                                    <Activity className="w-3.5 h-3.5" style={{ color: CYAN }} />
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,212,255,0.5)' }}>
                                    Ventas por Hora — Hoy
                                </p>
                            </div>
                            <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                                style={{ background: CYAN_ALPHA(0.1), color: CYAN }}>
                                {formatPrice(totalToday)}
                            </span>
                        </div>
                        <div className="h-44">
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>
                    </div>
                </div>

                {/* ── Fila 2: KPI secundarias ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                        { title: 'Clientes',      value: stats?.totalCustomers?.toString() || '0',  icon: Users,     href: '/dashboard/clients'    },
                        { title: 'Cotizaciones',  value: stats?.totalQuotes?.toString() || '0',     icon: FileText,  href: '/dashboard/quotes'     },
                        { title: 'Proveedores',   value: stats?.totalSuppliers?.toString() || '0',  icon: Truck,     href: '/dashboard/suppliers'  },
                        { title: 'Sucursales',    value: stats?.totalBranches?.toString() || '0',   icon: Store,     href: '/dashboard/branches'   },
                        { title: 'Ventas Hoy #',  value: completedSalesToday.length.toString(),     icon: Activity,  href: '/dashboard/sales'      },
                        { title: 'Monto Hoy',     value: formatPrice(totalToday),                   icon: DollarSign,href: '/dashboard/sales'      },
                    ].map(item => (
                        <MiniKpiCard key={item.title} {...item} />
                    ))}

                    {/* Pedidos Web */}
                    <WebOrdersCard pending={webOrdersPending} total={webOrdersTotal} />

                    {/* Detalles del Cierre */}
                    <ShiftClosureCard summary={shiftSummary} />
                </div>

                {/* ── Fila 2b: KPIs DTE Lioren ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DteMiniCard
                        title="DTE Emitidos"
                        value={dteStats?.totalAccepted ?? 0}
                        sub="total aceptados"
                        accent={CYAN}
                        accentAlpha={CYAN_ALPHA}
                    />
                    <DteMiniCard
                        title="DTE Este Mes"
                        value={dteStats?.thisMonth ?? 0}
                        sub="documentos del mes"
                        accent="#A78BFA"
                        accentAlpha={(a) => `rgba(167,139,250,${a})`}
                    />
                    <DteMiniCard
                        title="DTE Con Error"
                        value={dteStats?.errorCount ?? 0}
                        sub={dteStats?.errorCount ? 'requieren revisión' : 'sin errores'}
                        accent={dteStats?.errorCount ? '#F59E0B' : '#34D399'}
                        accentAlpha={dteStats?.errorCount
                            ? (a: number) => `rgba(245,158,11,${a})`
                            : (a: number) => `rgba(52,211,153,${a})`}
                        alert={!!(dteStats?.errorCount && dteStats.errorCount > 0)}
                    />
                    <MiniKpiCard
                        title="Config. DTE"
                        value="Lioren"
                        icon={FileText}
                        href="/dashboard/settings"
                    />
                </div>

                {/* ── Fila 4: Tablas de detalle ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Top productos del mes */}
                    <DetailCard
                        icon={<Zap className="w-3.5 h-3.5" style={{ color: '#A78BFA' }} />}
                        title="Top Productos — Mes"
                        iconBg="rgba(167,139,250,0.1)"
                        empty={!analytics?.topProducts || analytics.topProducts.length === 0}
                        emptyIcon={<Package className="w-8 h-8" style={{ color: 'rgba(0,212,255,0.15)' }} />}
                        emptyText="Sin ventas este mes"
                    >
                        <div className="divide-y" style={{ borderColor: 'rgba(0,212,255,0.06)' }}>
                            {(analytics?.topProducts || []).map((p, i) => (
                                <div key={p.id} className="px-4 py-2.5 flex items-center gap-3 group transition-colors"
                                    style={{ borderColor: 'rgba(0,212,255,0.06)' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.03)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                    <span className="text-[10px] font-black w-4 text-right flex-shrink-0 tabular-nums"
                                        style={{ color: i === 0 ? CYAN : 'rgba(180,195,220,0.25)' }}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(210,225,245,0.85)' }}>
                                            {p.name}
                                        </p>
                                        <p className="text-[10px]" style={{ color: 'rgba(180,195,220,0.35)' }}>
                                            {p.qty} uds
                                        </p>
                                    </div>
                                    <p className="text-[13px] font-bold tabular-nums flex-shrink-0"
                                        style={{ color: 'rgba(210,225,245,0.7)' }}>
                                        {formatPrice(p.revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </DetailCard>

                    {/* Stock Bajo */}
                    <DetailCard
                        icon={<AlertTriangle className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />}
                        title="Stock Bajo"
                        iconBg="rgba(245,158,11,0.1)"
                        headerRight={
                            <Link to="/dashboard/products"
                                className="text-[11px] font-semibold flex items-center gap-0.5 transition-colors"
                                style={{ color: CYAN_ALPHA(0.6) }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = CYAN}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = CYAN_ALPHA(0.6)}>
                                Ver todos <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        }
                        empty={lowStockProducts.length === 0}
                        emptyIcon={<Package className="w-8 h-8" style={{ color: 'rgba(0,212,255,0.15)' }} />}
                        emptyText="Sin alertas de stock"
                    >
                        <div className="divide-y" style={{ borderColor: 'rgba(0,212,255,0.06)' }}>
                            {lowStockProducts.map(product => (
                                <div key={product.id} className="px-4 py-2.5 flex items-center justify-between transition-colors"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.03)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(210,225,245,0.85)' }}>
                                            {product.name}
                                        </p>
                                        <p className="text-[10px]" style={{ color: 'rgba(180,195,220,0.35)' }}>
                                            {product.category?.name || 'Sin categoría'}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <span className={`text-[13px] font-bold tabular-nums`}
                                            style={{ color: product.stock === 0 ? '#F87171' : '#F59E0B' }}>
                                            {product.stock} uds
                                        </span>
                                        <p className="text-[10px]" style={{ color: 'rgba(180,195,220,0.3)' }}>
                                            mín. {product.minStock}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DetailCard>

                    {/* Ventas de Hoy */}
                    <DetailCard
                        icon={<ShoppingCart className="w-3.5 h-3.5" style={{ color: '#34D399' }} />}
                        title="Ventas de Hoy"
                        iconBg="rgba(52,211,153,0.1)"
                        headerRight={
                            <span className="text-[13px] font-bold tabular-nums" style={{ color: '#34D399' }}>
                                {formatPrice(totalToday)}
                            </span>
                        }
                        empty={completedSalesToday.length === 0}
                        emptyIcon={<ShoppingCart className="w-8 h-8" style={{ color: 'rgba(0,212,255,0.15)' }} />}
                        emptyText="No hay ventas hoy"
                    >
                        <div className="divide-y max-h-64 overflow-y-auto scrollbar-thin"
                            style={{ borderColor: 'rgba(0,212,255,0.06)' }}>
                            {completedSalesToday.slice(0, 15).map(sale => {
                                const method    = sale.payments?.[0]?.paymentMethod || '—';
                                const itemCount = sale.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? 0;
                                const time      = new Date(sale.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div key={sale.id} className="px-4 py-2.5 flex items-center justify-between transition-colors"
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.03)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                        <div>
                                            <p className="text-[13px] font-bold tabular-nums" style={{ color: 'rgba(210,225,245,0.9)' }}>
                                                {formatPrice(sale.total)}
                                            </p>
                                            <p className="text-[10px]" style={{ color: 'rgba(180,195,220,0.35)' }}>
                                                {itemCount} ítem{itemCount !== 1 ? 's' : ''} · {method}
                                            </p>
                                        </div>
                                        <span className="text-[11px] tabular-nums px-2 py-0.5 rounded-md"
                                            style={{ background: 'rgba(0,212,255,0.06)', color: 'rgba(0,212,255,0.5)' }}>
                                            {time}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {completedSalesToday.length > 0 && (
                            <div className="px-4 py-2 text-[10px] text-right"
                                style={{ borderTop: '1px solid rgba(0,212,255,0.06)', color: 'rgba(180,195,220,0.3)' }}>
                                {completedSalesToday.length} venta{completedSalesToday.length !== 1 ? 's' : ''} completada{completedSalesToday.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </DetailCard>
                </div>

            </div>

            {/* Acceso al POS */}
            <div className="flex justify-end mt-6">
                <NexoPosAccessButton userId={user?.id || ''} tenantId={user?.tenantId || ''} />
            </div>
        </DashboardLayout>
    );
}

// ── PrimaryKpiCard ──────────────────────────────────────────────────────────────
interface PrimaryKpiCardProps {
    title: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    accent: string;
    accentAlpha: (a: number) => string;
    trend?: number | null;
    alert?: boolean;
    span?: boolean;
}

function PrimaryKpiCard({ title, value, sub, icon: Icon, accent, accentAlpha, trend, alert: _alert }: PrimaryKpiCardProps) {
    return (
        <div className="relative rounded-2xl p-5 overflow-hidden group transition-all duration-300"
            style={{
                background: `linear-gradient(135deg, ${accentAlpha(0.06)} 0%, rgba(255,255,255,0.01) 100%)`,
                border: `1px solid ${accentAlpha(0.15)}`,
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accentAlpha(0.3);
                (e.currentTarget as HTMLElement).style.boxShadow   = `0 0 25px ${accentAlpha(0.12)}`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accentAlpha(0.15);
                (e.currentTarget as HTMLElement).style.boxShadow   = '';
            }}>

            {/* Background glow orb */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${accentAlpha(0.12)} 0%, transparent 70%)` }} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: accentAlpha(0.12), border: `1px solid ${accentAlpha(0.2)}` }}>
                        <Icon className="w-4 h-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accentAlpha(0.6)})` }} />
                    </div>
                    {trend !== null && trend !== undefined && (
                        <TrendBadge value={trend} />
                    )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: accentAlpha(0.55) }}>
                    {title}
                </p>
                <p className="text-2xl font-black tabular-nums leading-none"
                    style={{ color: 'rgba(210,225,245,0.95)' }}>
                    {value}
                </p>
                {sub && (
                    <p className="text-[10px] mt-1.5" style={{ color: 'rgba(180,195,220,0.35)' }}>{sub}</p>
                )}
            </div>
        </div>
    );
}

// ── MiniKpiCard ──────────────────────────────────────────────────────────────────
interface MiniKpiCardProps { title: string; value: string; icon: React.ElementType; href?: string; }

function MiniKpiCard({ title, value, icon: Icon, href }: MiniKpiCardProps) {
    const content = (
        <div className="rounded-xl p-4 h-full transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.08)' }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.2)';
                (e.currentTarget as HTMLElement).style.background  = 'rgba(0,212,255,0.04)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.08)';
                (e.currentTarget as HTMLElement).style.background  = 'rgba(255,255,255,0.02)';
            }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(0,212,255,0.4)' }}>
                    {title}
                </p>
                <Icon className="w-3 h-3" style={{ color: 'rgba(0,212,255,0.3)' }} />
            </div>
            <p className="text-xl font-black tabular-nums" style={{ color: 'rgba(210,225,245,0.9)' }}>
                {value}
            </p>
        </div>
    );
    return href ? <Link to={href} className="block h-full">{content}</Link> : content;
}

// ── DetailCard ────────────────────────────────────────────────────────────────────
interface DetailCardProps {
    icon: React.ReactNode;
    title: string;
    iconBg: string;
    headerRight?: React.ReactNode;
    empty: boolean;
    emptyIcon: React.ReactNode;
    emptyText: string;
    children?: React.ReactNode;
}

function DetailCard({ icon, title, iconBg, headerRight, empty, emptyIcon, emptyText, children }: DetailCardProps) {
    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.1)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: '1px solid rgba(0,212,255,0.07)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
                        {icon}
                    </div>
                    <h3 className="text-[12px] font-bold" style={{ color: 'rgba(210,225,245,0.8)' }}>
                        {title}
                    </h3>
                </div>
                {headerRight}
            </div>

            {/* Body */}
            {empty ? (
                <div className="py-12 flex flex-col items-center gap-2">
                    {emptyIcon}
                    <p className="text-[12px]" style={{ color: 'rgba(180,195,220,0.3)' }}>{emptyText}</p>
                </div>
            ) : children}
        </div>
    );
}

// ── TrendBadge ──────────────────────────────────────────────────────────────────
function TrendBadge({ value }: { value: number }) {
    const up = value >= 0;
    return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
                background: up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                color:      up ? '#34D399'               : '#F87171',
                border:     `1px solid ${up ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}>
            {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {up ? '+' : ''}{value.toFixed(1)}%
        </span>
    );
}

// ── DteMiniCard ── tarjeta especializada para indicadores DTE Lioren ───────────
interface DteMiniCardProps {
    title: string;
    value: number;
    sub?: string;
    accent: string;
    accentAlpha: (a: number) => string;
    alert?: boolean;
}

function DteMiniCard({ title, value, sub, accent: _accent, accentAlpha, alert }: DteMiniCardProps) {
    return (
        <div className="rounded-xl p-4 transition-all duration-200 relative overflow-hidden"
            style={{
                background: accentAlpha(0.04),
                border: `1px solid ${accentAlpha(alert ? 0.3 : 0.12)}`,
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accentAlpha(0.3);
                (e.currentTarget as HTMLElement).style.boxShadow   = `0 0 18px ${accentAlpha(0.1)}`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accentAlpha(alert ? 0.3 : 0.12);
                (e.currentTarget as HTMLElement).style.boxShadow   = '';
            }}>
            {/* Glow orb */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${accentAlpha(0.1)} 0%, transparent 70%)` }} />

            <div className="relative z-10">
                {/* Badge Lioren */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: accentAlpha(0.55) }}>
                        {title}
                    </p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider"
                        style={{ background: accentAlpha(0.12), color: accentAlpha(0.7) }}>
                        LIOREN
                    </span>
                </div>

                <p className="text-2xl font-black tabular-nums leading-none"
                    style={{ color: 'rgba(210,225,245,0.95)' }}>
                    {value.toLocaleString('es-CL')}
                </p>

                {sub && (
                    <p className="text-[10px] mt-1.5" style={{ color: 'rgba(180,195,220,0.35)' }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── WebOrdersCard ────────────────────────────────────────────────────────────────
interface WebOrdersCardProps { pending: number; total: number; }

function WebOrdersCard({ pending, total }: WebOrdersCardProps) {
    return (
        <Link to="/dashboard/integrations" className="block h-full">
            <div className="rounded-xl p-4 h-full transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.08)' }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.2)';
                    (e.currentTarget as HTMLElement).style.background  = 'rgba(0,212,255,0.04)';
                    (e.currentTarget as HTMLElement).style.boxShadow   = '0 0 15px rgba(0,212,255,0.05)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.08)';
                    (e.currentTarget as HTMLElement).style.background  = 'rgba(255,255,255,0.02)';
                    (e.currentTarget as HTMLElement).style.boxShadow   = '';
                }}>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: 'rgba(0,212,255,0.4)' }}>
                        Pedidos Web
                    </p>
                    <Globe className="w-3.5 h-3.5 text-[#00D4FF]" />
                </div>
                <div>
                    <p className="text-xl font-black text-white tabular-nums leading-none">
                        {pending} <span className="text-[11px] font-medium text-gray-400">Pendientes</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-2 font-medium">
                        {total} pedidos totales importados
                    </p>
                </div>
            </div>
        </Link>
    );
}

// ── ShiftClosureCard ─────────────────────────────────────────────────────────────
interface ShiftClosureCardProps { summary: any; }

function ShiftClosureCard({ summary }: ShiftClosureCardProps) {
    const isActive = summary?.active ?? false;
    const cash = summary?.paymentMethods?.EFECTIVO ?? 0;
    const debit = summary?.paymentMethods?.DEBITO ?? 0;
    const transfer = summary?.paymentMethods?.TRANSFERENCIA ?? 0;

    return (
        <Link to="/dashboard/treasury" className="block h-full">
            <div className="rounded-xl p-3.5 h-full transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.08)' }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.2)';
                    (e.currentTarget as HTMLElement).style.background  = 'rgba(0,212,255,0.04)';
                    (e.currentTarget as HTMLElement).style.boxShadow   = '0 0 15px rgba(0,212,255,0.05)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.08)';
                    (e.currentTarget as HTMLElement).style.background  = 'rgba(255,255,255,0.02)';
                    (e.currentTarget as HTMLElement).style.boxShadow   = '';
                }}>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: 'rgba(0,212,255,0.4)' }}>
                        Detalles del Cierre
                    </p>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                        isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' 
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                        {isActive ? 'Abierto' : 'Sin Turno'}
                    </span>
                </div>

                <div className="space-y-1.5 my-1">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Efectivo
                        </span>
                        <span className="font-bold font-mono text-emerald-400 tabular-nums">
                            {formatPrice(cash)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                            Débito
                        </span>
                        <span className="font-bold font-mono text-[#00D4FF] tabular-nums">
                            {formatPrice(debit)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Transf.
                        </span>
                        <span className="font-bold font-mono text-purple-400 tabular-nums">
                            {formatPrice(transfer)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
