import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

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

    // Mock data for growth chart
    const growthData = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Nuevos Tenants',
                data: [5, 8, 12, 15, 18, metrics?.totalTenants || 20],
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                tension: 0.4,
            },
        ],
    };

    // Mock data for plan distribution
    const planData = {
        labels: ['Plan Básico', 'Plan Pro', 'Plan Enterprise'],
        datasets: [
            {
                data: [45, 35, 20],
                backgroundColor: [
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                ],
                borderColor: [
                    'rgb(168, 85, 247)',
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'rgb(163, 163, 163)',
                },
            },
        },
        scales: {
            y: {
                ticks: { color: 'rgb(163, 163, 163)' },
                grid: { color: 'rgba(163, 163, 163, 0.1)' },
            },
            x: {
                ticks: { color: 'rgb(163, 163, 163)' },
                grid: { color: 'rgba(163, 163, 163, 0.1)' },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: 'rgb(163, 163, 163)',
                    padding: 20,
                },
            },
        },
    };

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
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 h-96">
                    <h3 className="text-white font-semibold mb-4">Crecimiento de Tenants</h3>
                    <div className="h-80">
                        <Line data={growthData} options={chartOptions} />
                    </div>
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 h-96">
                    <h3 className="text-white font-semibold mb-4">Distribución de Planes</h3>
                    <div className="h-80">
                        <Doughnut data={planData} options={doughnutOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
