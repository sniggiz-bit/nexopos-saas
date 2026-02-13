import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

interface DashboardMetrics {
    totalTenants: number;
    mrr: number;
    activeUsers: number;
}

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-neutral-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            </div>
            <div className="p-3 bg-neutral-700/50 rounded-lg text-purple-400">
                <Icon size={24} />
            </div>
        </div>
        {trend && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <TrendingUp size={14} />
                <span>{trend} vs mes anterior</span>
            </div>
        )}
    </div>
);

export default function AdminDashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Replace with actual API call
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setMetrics(response.data);
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="text-white">Cargando métricas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Tenants"
                    value={metrics?.totalTenants || 0}
                    icon={Users}
                    trend="+12%"
                />
                <StatCard
                    title="MRR Estimado"
                    value={`$${(metrics?.mrr || 0).toLocaleString('es-CL')}`}
                    icon={DollarSign}
                    trend="+5%"
                />
                <StatCard
                    title="Usuarios Activos Hoy"
                    value={metrics?.activeUsers || 0}
                    icon={Activity}

                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 h-96 flex items-center justify-center">
                    <span className="text-neutral-500">Métricas de crecimiento (Próximamente... Chart.js)</span>
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 h-96 flex items-center justify-center">
                    <span className="text-neutral-500">Distribución de Planes (Próximamente...)</span>
                </div>
            </div>
        </div>
    );
}
