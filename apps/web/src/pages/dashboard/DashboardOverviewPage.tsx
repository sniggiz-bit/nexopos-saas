import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import {
    Package, ShoppingCart, TrendingUp, AlertTriangle,
    Users, Truck, Store, FileText, ArrowUpRight,
    TrendingDown, Minus,
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
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function DashboardOverviewPage() {
    const { user } = useAuth();
    const { data: stats, isLoading } = useDashboardStats(user?.tenantId || '', user?.branchId || 'branch-1');
    const { data: products } = useProducts(user?.tenantId);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const { data: todaySales } = useQuery({
        queryKey: ['sales', 'today', user?.tenantId, todayStr],
        queryFn: () => getSales({
            startDate: `${todayStr}T00:00:00`,
            endDate: `${todayStr}T23:59:59`,
            tenantId: user?.tenantId,
        }),
        enabled: !!user?.tenantId,
    });

    const { data: analytics } = useQuery({
        queryKey: ['dashboard', 'analytics', user?.tenantId],
        queryFn: () => getDashboardAnalytics(user!.tenantId, user?.branchId),
        enabled: !!user?.tenantId,
        staleTime: 5 * 60 * 1000,
    });

    const lowStockProducts = (products || [])
        .filter(p => p.stock <= p.minStock)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10);

    const completedSalesToday = (todaySales || []).filter(s => s.status === 'COMPLETED');
    const totalToday = completedSalesToday.reduce((sum, s) => sum + s.total, 0);
    const lowStockCount = stats?.lowStockCount ?? 0;

    // Hourly chart data - only show hours 6–23
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
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => ` ${formatPrice(ctx.raw)}`,
                },
            },
        },
        scales: {
            y: {
                ticks: {
                    color: 'rgb(148, 163, 184)',
                    callback: (v: any) => `$${(v / 1000).toFixed(0)}k`,
                },
                grid: { color: 'rgba(148, 163, 184, 0.08)' },
            },
            x: {
                ticks: { color: 'rgb(148, 163, 184)', font: { size: 10 } },
                grid: { display: false },
            },
        },
    };

    const mc = analytics?.monthComparison;
    const pctChange = mc?.pctChange;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* ── KPI primarias ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PrimaryKpiCard
                        title="Ventas Hoy"
                        value={formatPrice(stats?.salesToday || 0)}
                        icon={ShoppingCart}
                        gradient="from-indigo-600 to-indigo-500"
                        shadow="shadow-indigo-200"
                    />
                    <PrimaryKpiCard
                        title="Ingresos del Mes"
                        value={formatPrice(stats?.monthRevenue || 0)}
                        icon={TrendingUp}
                        gradient="from-violet-600 to-violet-500"
                        shadow="shadow-violet-200"
                    />
                </div>

                {/* ── KPI secundarias ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SecondaryKpiCard title="Stock Bajo" value={lowStockCount.toString()} icon={AlertTriangle} alert={lowStockCount > 0} href="/dashboard/reports/critical-stock" />
                    <SecondaryKpiCard title="Total Productos" value={stats?.totalProducts?.toString() || '0'} icon={Package} href="/dashboard/products" />
                    <SecondaryKpiCard title="Clientes" value={stats?.totalCustomers?.toString() || '0'} icon={Users} href="/dashboard/clients" />
                    <SecondaryKpiCard title="Cotizaciones" value={stats?.totalQuotes?.toString() || '0'} icon={FileText} href="/dashboard/quotes" />
                    <SecondaryKpiCard title="Proveedores" value={stats?.totalSuppliers?.toString() || '0'} icon={Truck} href="/dashboard/suppliers" />
                    <SecondaryKpiCard title="Sucursales" value={stats?.totalBranches?.toString() || '0'} icon={Store} href="/dashboard/branches" />
                </div>

                {/* ── Comparativa mes + chart ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Comparativa mensual */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Comparativa Mensual</p>
                            <p className="text-3xl font-black tabular-nums text-slate-800 dark:text-slate-100 mb-1">
                                {formatPrice(mc?.currentRevenue ?? 0)}
                            </p>
                            <p className="text-xs text-slate-400">mes actual</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">mes anterior</p>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">{formatPrice(mc?.prevRevenue ?? 0)}</p>
                                </div>
                                {pctChange !== null && pctChange !== undefined ? (
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${pctChange >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {pctChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">
                                        <Minus size={12} />
                                        Sin datos
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart ventas por hora */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Ventas por Hora — Hoy</p>
                        <div className="h-44">
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>
                    </div>
                </div>

                {/* ── Paneles de detalle ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Top productos del mes */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-violet-500" />
                                Top Productos — Mes
                            </h3>
                        </div>
                        {(!analytics?.topProducts || analytics.topProducts.length === 0) ? (
                            <div className="px-5 py-10 text-center">
                                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Sin ventas este mes</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-700">
                                {analytics.topProducts.map((p, i) => (
                                    <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                                            <p className="text-xs text-slate-400">{p.qty} uds vendidas</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums flex-shrink-0">
                                            {formatPrice(p.revenue)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stock Bajo */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Stock Bajo
                            </h3>
                            <Link to="/dashboard/products" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5">
                                Ver todos <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                        {lowStockProducts.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Sin alertas de stock</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-700">
                                {lowStockProducts.map(product => (
                                    <div key={product.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{product.name}</p>
                                            <p className="text-xs text-slate-400">{product.category?.name || 'Sin categoría'}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <span className={`text-sm font-bold tabular-nums ${product.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                                {product.stock} uds
                                            </span>
                                            <p className="text-xs text-slate-400">mín. {product.minStock}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ventas de Hoy */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                                Ventas de Hoy
                            </h3>
                            <span className="text-sm font-bold text-emerald-600 tabular-nums">
                                {formatPrice(totalToday)}
                            </span>
                        </div>
                        {completedSalesToday.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No hay ventas hoy</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-72 overflow-y-auto scrollbar-thin">
                                {completedSalesToday.slice(0, 15).map(sale => {
                                    const method = sale.payments?.[0]?.paymentMethod || '—';
                                    const itemCount = sale.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
                                    const time = new Date(sale.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={sale.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">{formatPrice(sale.total)}</p>
                                                <p className="text-xs text-slate-400">{itemCount} ítem{itemCount !== 1 ? 's' : ''} · {method}</p>
                                            </div>
                                            <span className="text-xs text-slate-400 tabular-nums">{time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {completedSalesToday.length > 0 && (
                            <div className="px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
                                {completedSalesToday.length} venta{completedSalesToday.length !== 1 ? 's' : ''} completada{completedSalesToday.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <div className="flex justify-end mt-6">
                <NexoPosAccessButton userId={user?.id || ''} tenantId={user?.tenantId || ''} />
            </div>
        </DashboardLayout>
    );
}

/* ── KPI primaria ── */
interface PrimaryKpiCardProps { title: string; value: string; icon: React.ElementType; gradient: string; shadow: string; }

function PrimaryKpiCard({ title, value, icon: Icon, gradient, shadow }: PrimaryKpiCardProps) {
    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg ${shadow} text-white relative overflow-hidden`}>
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">{title}</p>
                    <p className="text-4xl font-black tabular-nums text-white leading-none">{value}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl"><Icon className="w-6 h-6 text-white" /></div>
            </div>
        </div>
    );
}

/* ── KPI secundaria ── */
interface SecondaryKpiCardProps { title: string; value: string; icon: React.ElementType; alert?: boolean; href?: string; }

function SecondaryKpiCard({ title, value, icon: Icon, alert = false, href }: SecondaryKpiCardProps) {
    const inner = (
        <div className={[
            'bg-white dark:bg-slate-800 rounded-xl border shadow-sm p-5 h-full transition-all duration-150',
            alert ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700',
            href ? 'hover:shadow-md hover:border-indigo-200 cursor-pointer' : '',
        ].join(' ')}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{title}</p>
                    <p className={`text-3xl font-black tabular-nums leading-none ${alert ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${alert ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-slate-50 dark:bg-slate-700'}`}>
                    <Icon className={`w-5 h-5 ${alert ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
            </div>
        </div>
    );
    if (href) return <Link to={href} className="block h-full">{inner}</Link>;
    return inner;
}
