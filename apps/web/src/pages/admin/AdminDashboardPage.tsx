import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Users, DollarSign, Activity, TrendingUp, UserCheck, UserX, CalendarPlus } from 'lucide-react';
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
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

interface PlanDist {
  planId: string;
  name: string;
  price: number;
  count: number;
}

interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  newThisMonth: number;
  mrr: number;
  activeUsers: number;
  planDistribution: PlanDist[];
}

const PLAN_COLORS = [
  'rgba(168, 85, 247, 0.85)',
  'rgba(59, 130, 246, 0.85)',
  'rgba(16, 185, 129, 0.85)',
  'rgba(245, 158, 11, 0.85)',
  'rgba(239, 68, 68, 0.85)',
];

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'text-purple-400',
  sub,
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
  sub?: string;
}) => (
  <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-sm flex items-start gap-4">
    <div className={`p-3 bg-neutral-700/50 rounded-lg ${color} flex-shrink-0`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-neutral-400 text-xs font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
      {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setMetrics(res.data))
      .catch(err => console.error('Error fetching metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  const planDist = metrics?.planDistribution ?? [];

  const doughnutData = {
    labels: planDist.map(p => p.name),
    datasets: [
      {
        data: planDist.map(p => p.count),
        backgroundColor: planDist.map((_, i) => PLAN_COLORS[i % PLAN_COLORS.length]),
        borderColor: planDist.map((_, i) => PLAN_COLORS[i % PLAN_COLORS.length].replace('0.85', '1')),
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'rgb(163, 163, 163)', padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const plan = planDist[ctx.dataIndex];
            return ` ${plan.count} tenant${plan.count !== 1 ? 's' : ''} — $${plan.price.toLocaleString('es-CL')}/mes c/u`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500 text-sm">Cargando métricas...</div>
      </div>
    );
  }

  const suspendedPct = metrics && metrics.totalTenants > 0
    ? ((metrics.suspendedTenants / metrics.totalTenants) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Clientes"
          value={metrics?.totalTenants ?? 0}
          icon={Users}
          color="text-purple-400"
          sub="empresas registradas"
        />
        <StatCard
          title="MRR"
          value={`$${(metrics?.mrr ?? 0).toLocaleString('es-CL')}`}
          icon={DollarSign}
          color="text-emerald-400"
          sub="ingresos recurrentes estimados"
        />
        <StatCard
          title="Usuarios Activos Hoy"
          value={metrics?.activeUsers ?? 0}
          icon={Activity}
          color="text-blue-400"
          sub="sesiones del día"
        />
        <StatCard
          title="Clientes Activos"
          value={metrics?.activeTenants ?? 0}
          icon={UserCheck}
          color="text-emerald-400"
          sub={`${metrics && metrics.totalTenants > 0 ? (((metrics.activeTenants / metrics.totalTenants) * 100).toFixed(1)) : 0}% del total`}
        />
        <StatCard
          title="Suspendidos"
          value={metrics?.suspendedTenants ?? 0}
          icon={UserX}
          color="text-red-400"
          sub={`${suspendedPct}% del total`}
        />
        <StatCard
          title="Nuevos Este Mes"
          value={metrics?.newThisMonth ?? 0}
          icon={CalendarPlus}
          color="text-amber-400"
          sub="altas en el mes actual"
        />
      </div>

      {/* Distribución de planes + resumen por plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h3 className="text-foreground font-semibold mb-4">Distribución de Planes</h3>
          {planDist.length > 0 ? (
            <div className="h-64">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-neutral-600 text-sm">
              Sin datos de planes
            </div>
          )}
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h3 className="text-foreground font-semibold mb-4">Planes Activos</h3>
          <div className="space-y-3">
            {planDist.length === 0 && (
              <p className="text-neutral-600 text-sm">Sin datos</p>
            )}
            {planDist.map((plan, i) => {
              const pct = metrics && metrics.totalTenants > 0
                ? (plan.count / metrics.totalTenants) * 100
                : 0;
              return (
                <div key={plan.planId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }}
                      />
                      <span className="text-sm text-neutral-300">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground">{plan.count}</span>
                      <span className="text-xs text-neutral-500 ml-1.5">
                        ${(plan.price * plan.count).toLocaleString('es-CL')}/mes
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: PLAN_COLORS[i % PLAN_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {metrics && metrics.mrr > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-700 flex items-center justify-between">
              <span className="text-xs text-neutral-500">MRR Total</span>
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                <TrendingUp size={14} />
                ${metrics.mrr.toLocaleString('es-CL')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
