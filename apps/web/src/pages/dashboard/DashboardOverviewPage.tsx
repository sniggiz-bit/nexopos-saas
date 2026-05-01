import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Users, Truck, Store, FileText } from 'lucide-react';
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

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local
    const { data: todaySales } = useQuery({
        queryKey: ['sales', 'today', user?.tenantId, todayStr],
        queryFn: () => getSales({
            startDate: `${todayStr}T00:00:00`,
            endDate: `${todayStr}T23:59:59`,
            tenantId: user?.tenantId,
        }),
        enabled: !!user?.tenantId,
    });

    const lowStockProducts = (products || [])
        .filter(p => p.stock <= p.minStock)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10);

    const completedSalesToday = (todaySales || []).filter(s => s.status === 'COMPLETED');
    const totalToday = completedSalesToday.reduce((sum, s) => sum + s.total, 0);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Welcome Message */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Bienvenido al Panel de Administración
                    </h3>
                    <p className="text-gray-600 text-sm">
                        Gestiona productos, inventario, categorías y configuración de facturación desde aquí.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Ventas Hoy"
                        value={formatPrice(stats?.salesToday || 0)}
                        icon={ShoppingCart}
                        color="green"
                    />
                    <StatCard
                        title="Ingresos Mes"
                        value={formatPrice(stats?.monthRevenue || 0)}
                        icon={TrendingUp}
                        color="purple"
                    />
                    <StatCard
                        title="Total Productos"
                        value={stats?.totalProducts?.toString() || '0'}
                        icon={Package}
                        color="blue"
                        href="/dashboard/products"
                    />
                    <StatCard
                        title="Stock Bajo"
                        value={stats?.lowStockCount?.toString() || '0'}
                        icon={AlertTriangle}
                        color="yellow"
                        href="/dashboard/products"
                    />
                    <StatCard
                        title="Proveedores"
                        value={stats?.totalSuppliers?.toString() || '0'}
                        icon={Truck}
                        color="indigo"
                        href="/dashboard/suppliers"
                    />
                    <StatCard
                        title="Sucursales"
                        value={stats?.totalBranches?.toString() || '0'}
                        icon={Store}
                        color="orange"
                        href="/dashboard/branches"
                    />
                    <StatCard
                        title="Clientes"
                        value={stats?.totalCustomers?.toString() || '0'}
                        icon={Users}
                        color="teal"
                        href="/dashboard/customers"
                    />
                    <StatCard
                        title="Cotizaciones"
                        value={stats?.totalQuotes?.toString() || '0'}
                        icon={FileText}
                        color="pink"
                        href="/dashboard/quotes"
                    />
                </div>

                {/* Two-column panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Low Stock Panel */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                Productos con Stock Bajo
                            </h3>
                            <Link to="/dashboard/products" className="text-sm text-blue-600 hover:underline">
                                Ver todos
                            </Link>
                        </div>
                        {lowStockProducts.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-gray-500">
                                Sin alertas de stock bajo
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {lowStockProducts.map(product => (
                                    <div key={product.id} className="px-6 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.category?.name || 'Sin categoría'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                                                {product.stock} uds
                                            </span>
                                            <p className="text-xs text-gray-400">mín. {product.minStock}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Today's Sales Panel */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-green-500" />
                                Ventas de Hoy
                            </h3>
                            <span className="text-sm font-semibold text-green-700">
                                Total: {formatPrice(totalToday)}
                            </span>
                        </div>
                        {completedSalesToday.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-gray-500">
                                No hay ventas registradas hoy
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                {completedSalesToday.slice(0, 15).map(sale => {
                                    const paymentMethod = sale.payments?.[0]?.paymentMethod || '—';
                                    const itemCount = sale.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
                                    const time = new Date(sale.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={sale.id} className="px-6 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{formatPrice(sale.total)}</p>
                                                <p className="text-xs text-gray-500">{itemCount} ítem{itemCount !== 1 ? 's' : ''} · {paymentMethod}</p>
                                            </div>
                                            <span className="text-xs text-gray-400">{time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {completedSalesToday.length > 0 && (
                            <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
                                {completedSalesToday.length} venta{completedSalesToday.length !== 1 ? 's' : ''} completada{completedSalesToday.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <div className="flex justify-end mt-6">
                <NexoPosAccessButton
                    userId={user?.id || ''}
                    tenantId={user?.tenantId || ''}
                />
            </div>
        </DashboardLayout>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'orange' | 'teal' | 'pink';
    href?: string;
}

function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        orange: 'bg-orange-50 text-orange-600',
        teal: 'bg-teal-50 text-teal-600',
        pink: 'bg-pink-50 text-pink-600',
    };

    const cardContent = (
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link to={href} className="block h-full cursor-pointer">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}
