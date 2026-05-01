import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import {
    Package, ShoppingCart, TrendingUp, AlertTriangle,
    Users, Truck, Store, FileText, ArrowRight,
} from 'lucide-react';
import { NexoPosAccessButton } from '../../components/NexoPosAccessButton';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { formatPrice } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSales } from '../../api/sales';

export function DashboardOverviewPage() {
    const { user } = useAuth();
    const { data: stats, isLoading } = useDashboardStats(user?.tenantId || '', user?.branchId || 'branch-1');
    const { data: products } = useProducts(user?.tenantId);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const { data: todaySales } = useQuery({
        queryKey: ['sales', 'today', user?.tenantId, todayStr],
        queryFn: () => getSales({
            startDate: `${todayStr}T00:00:00`,
            endDate:   `${todayStr}T23:59:59`,
            tenantId:  user?.tenantId,
        }),
        enabled: !!user?.tenantId,
    });

    const lowStockProducts = (products || [])
        .filter(p => p.stock <= p.minStock)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10);

    const completedSalesToday = (todaySales || []).filter(s => s.status === 'COMPLETED');
    const totalToday = completedSalesToday.reduce((sum, s) => sum + s.total, 0);
    const lowStockCount = stats?.lowStockCount ?? 0;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* ── KPI primarios (2 columnas anchas) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                        title="Ventas Hoy"
                        value={formatPrice(stats?.salesToday || 0)}
                        icon={ShoppingCart}
                        variant="primary"
                    />
                    <StatCard
                        title="Ingresos del Mes"
                        value={formatPrice(stats?.monthRevenue || 0)}
                        icon={TrendingUp}
                        variant="primary"
                    />
                </div>

                {/* ── KPI secundarios (4 columnas) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Stock Bajo"
                        value={lowStockCount.toString()}
                        icon={AlertTriangle}
                        variant={lowStockCount > 0 ? 'warning' : 'default'}
                        href="/dashboard/reports/critical-stock"
                    />
                    <StatCard
                        title="Total Productos"
                        value={stats?.totalProducts?.toString() || '0'}
                        icon={Package}
                        variant="default"
                        href="/dashboard/products"
                    />
                    <StatCard
                        title="Clientes"
                        value={stats?.totalCustomers?.toString() || '0'}
                        icon={Users}
                        variant="default"
                        href="/dashboard/clients"
                    />
                    <StatCard
                        title="Cotizaciones"
                        value={stats?.totalQuotes?.toString() || '0'}
                        icon={FileText}
                        variant="default"
                        href="/dashboard/quotes"
                    />
                    <StatCard
                        title="Proveedores"
                        value={stats?.totalSuppliers?.toString() || '0'}
                        icon={Truck}
                        variant="default"
                        href="/dashboard/suppliers"
                    />
                    <StatCard
                        title="Sucursales"
                        value={stats?.totalBranches?.toString() || '0'}
                        icon={Store}
                        variant="default"
                        href="/dashboard/branches"
                    />
                </div>

                {/* ── Paneles de detalle ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Stock Bajo */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-warning" />
                                Productos con Stock Bajo
                            </h3>
                            <Link
                                to="/dashboard/products"
                                className="text-xs text-primary hover:underline flex items-center gap-0.5"
                            >
                                Ver todos <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        {lowStockProducts.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Sin alertas de stock</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {lowStockProducts.map(product => (
                                    <div key={product.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.category?.name || 'Sin categoría'}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <span className={`text-sm font-bold tabular-nums ${product.stock === 0 ? 'text-danger' : 'text-warning'}`}>
                                                {product.stock} uds
                                            </span>
                                            <p className="text-xs text-muted-foreground">mín. {product.minStock}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ventas de Hoy */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-success" />
                                Ventas de Hoy
                            </h3>
                            <span className="text-sm font-bold text-success tabular-nums">
                                {formatPrice(totalToday)}
                            </span>
                        </div>
                        {completedSalesToday.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No hay ventas registradas hoy</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border max-h-72 overflow-y-auto scrollbar-thin">
                                {completedSalesToday.slice(0, 15).map(sale => {
                                    const method    = sale.payments?.[0]?.paymentMethod || '—';
                                    const itemCount = sale.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
                                    const time      = new Date(sale.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={sale.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground tabular-nums">
                                                    {formatPrice(sale.total)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {itemCount} ítem{itemCount !== 1 ? 's' : ''} · {method}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground tabular-nums">{time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {completedSalesToday.length > 0 && (
                            <div className="px-5 py-2.5 border-t border-border text-xs text-muted-foreground text-right">
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

/* ── StatCard ── */

type StatVariant = 'primary' | 'warning' | 'default';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    variant?: StatVariant;
    href?: string;
}

function StatCard({ title, value, icon: Icon, variant = 'default', href }: StatCardProps) {
    const styles: Record<StatVariant, { icon: string; value: string; bar: string }> = {
        primary: {
            icon:  'bg-primary/10 text-primary',
            value: 'text-foreground',
            bar:   'bg-primary',
        },
        warning: {
            icon:  'bg-warning-subtle text-warning',
            value: 'text-warning',
            bar:   'bg-warning',
        },
        default: {
            icon:  'bg-muted text-muted-foreground',
            value: 'text-foreground',
            bar:   'bg-border',
        },
    };

    const s = styles[variant];
    const isPrimary = variant === 'primary';

    const inner = (
        <div className={[
            'relative bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full',
            'transition-all duration-150',
            href ? 'hover:shadow-card-hover hover:border-primary/30 cursor-pointer' : '',
        ].join(' ')}>
            {/* accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bar}`} />

            <div className={`flex items-center justify-between ${isPrimary ? 'p-6' : 'p-4'}`}>
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {title}
                    </p>
                    <p className={[
                        'font-black tabular-nums leading-none',
                        isPrimary ? 'text-3xl' : 'text-2xl',
                        s.value,
                    ].join(' ')}>
                        {value}
                    </p>
                </div>
                <div className={`${isPrimary ? 'p-3' : 'p-2.5'} rounded-xl ${s.icon}`}>
                    <Icon className={isPrimary ? 'w-6 h-6' : 'w-5 h-5'} />
                </div>
            </div>

            {href && (
                <div className="px-4 pb-3 -mt-1">
                    <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        Ver detalle <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link to={href} className="group block h-full">
                {inner}
            </Link>
        );
    }

    return inner;
}
