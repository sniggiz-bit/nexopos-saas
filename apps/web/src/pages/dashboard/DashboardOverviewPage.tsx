import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { NexoPosAccessButton } from '../../components/NexoPosAccessButton';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';

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
                        title="Total Productos"
                        value={stats?.totalProducts?.toString() || '0'}
                        icon={Package}
                        color="blue"
                    />
                    <StatCard
                        title="Ventas Hoy"
                        value={formatPrice(stats?.salesToday || 0)}
                        icon={ShoppingCart}
                        color="green"
                    />
                    <StatCard
                        title="Stock Bajo"
                        value={stats?.lowStockCount?.toString() || '0'}
                        icon={AlertTriangle}
                        color="yellow"
                    />
                    <StatCard
                        title="Ingresos Mes"
                        value={formatPrice(stats?.monthRevenue || 0)}
                        icon={TrendingUp}
                        color="purple"
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
    color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
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
}
