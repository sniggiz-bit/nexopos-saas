import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Users, Truck, Store, FileText } from 'lucide-react';
import { NexoPosAccessButton } from '../../components/NexoPosAccessButton';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export function DashboardOverviewPage() {
    const { user } = useAuth();
    const { data: stats, isLoading } = useDashboardStats(user?.tenantId || '', user?.branchId || 'branch-1');

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
                        href="/dashboard/quotes" // Assuming this is the route, normally it's /dashboard/quotes
                    />
                </div>

                {/* Welcome Message */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Bienvenido al Panel de Administración
                    </h3>
                    <p className="text-gray-600">
                        Gestiona productos, inventario, categorías y configuración de facturación desde aquí.
                    </p>
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
