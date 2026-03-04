import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { useTreasuryReceivables, useTreasuryCashFlow, useTreasuryMaturities } from '../../hooks/useTreasury';
import { CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';

export function TreasuryPage() {
    const tenantId = 'tenant-1'; // TODO: Get from context/auth
    const { data: receivables, isLoading: loadingReceivables } = useTreasuryReceivables(tenantId);
    const { data: cashFlow, isLoading: loadingCashFlow } = useTreasuryCashFlow(tenantId);
    const { data: maturities, isLoading: loadingMaturities } = useTreasuryMaturities(tenantId);

    if (loadingReceivables || loadingCashFlow || loadingMaturities) {
        return (
            <DashboardLayout>
                <LoadingSpinner />
            </DashboardLayout>
        );
    }

    const totalCashFlow = cashFlow?.reduce((sum, item) => sum + item.amount, 0) || 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard de Tesorería</h1>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard
                        title="Cuentas por Cobrar"
                        value={formatCurrency(receivables?.total || 0)}
                        subtitle={`${receivables?.count || 0} créditos pendientes`}
                        icon={CreditCard}
                        color="blue"
                    />
                    <KpiCard
                        title="Flujo de Caja (Hoy)"
                        value={formatCurrency(totalCashFlow)}
                        subtitle="Ingresos del día"
                        icon={TrendingUp}
                        color="green"
                    />
                    <KpiCard
                        title="Próximos Vencimientos"
                        value={maturities?.length.toString() || "0"}
                        subtitle="En los próximos 7 días"
                        icon={Calendar}
                        color="yellow"
                    />
                </div>

                {/* Cash Flow Detail */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle Flujo de Caja (Hoy)</h2>
                        <div className="space-y-4">
                            {cashFlow?.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay movimientos hoy.</p>
                            ) : (
                                cashFlow?.map((item) => (
                                    <div key={item.method} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <span className="text-gray-700 font-medium">{item.method}</span>
                                        <span className="text-gray-900 font-bold">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Maturities Detail */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos Vencimientos (7 días)</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vence</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {maturities?.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                                                No hay vencimientos próximos.
                                            </td>
                                        </tr>
                                    ) : (
                                        maturities?.map((credit) => (
                                            <tr key={credit.id}>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{credit.customer.name}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {credit.dueDate ? formatDate(credit.dueDate) : '-'}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                    {formatCurrency(credit.balance)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

interface KpiCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'yellow' | 'purple';
}

function KpiCard({ title, value, subtitle, icon: Icon, color }: KpiCardProps) {
    const colorClasses: Record<string, string> = {
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
                    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-gray-50 text-gray-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
