import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useTreasuryReceivables, useTreasuryCashFlow, useTreasuryMaturities } from '../../hooks/useTreasury';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  CreditCard, Calendar, TrendingUp, Clock, ChevronDown, ChevronUp,
  History, LayoutDashboard, DollarSign, AlertCircle,
  Loader2, RefreshCw, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ShiftRecord {
  id: string;
  startTime: string;
  endTime: string | null;
  status: string;
  initialAmount: string;
  finalAmount: string | null;
  expectedAmount: string | null;
  difference: string | null;
  metadata: Record<string, any> | null;
  branch: { name: string };
  openedBy: { name: string; email: string };
  closedBy: { name: string; email: string } | null;
}

interface ShiftHistory {
  data: ShiftRecord[];
  total: number;
  page: number;
  lastPage: number;
}

type Tab = 'resumen' | 'cierres';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number | string | null | undefined) =>
  formatCurrency(Number(n ?? 0));

const diffColor = (diff: number) => {
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-600';
  return 'text-gray-500';
};

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferencia',
};

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KpiCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ── Shift Row (expandible) ─────────────────────────────────────────────────────

function ShiftRow({ shift }: { shift: ShiftRecord }) {
  const [open, setOpen] = useState(false);
  const diff = Number(shift.difference ?? 0);
  const meta = shift.metadata as any;

  const duration = shift.endTime
    ? (() => {
        const ms = new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime();
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return `${h}h ${m}m`;
      })()
    : '—';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-shrink-0">
          {diff === 0
            ? <CheckCircle2 size={16} className="text-gray-400" />
            : diff > 0
              ? <CheckCircle2 size={16} className="text-emerald-500" />
              : <AlertCircle size={16} className="text-red-500" />}
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 min-w-0">
          <div>
            <p className="text-xs text-gray-400">Fecha</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(shift.startTime).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Sucursal</p>
            <p className="text-sm font-medium text-gray-700 truncate">{shift.branch.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Cajero</p>
            <p className="text-sm font-medium text-gray-700 truncate">{shift.openedBy.name || shift.openedBy.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total ventas</p>
            <p className="text-sm font-bold text-gray-900">{fmt(meta?.totalSales)}</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Diferencia</p>
            <p className={`text-sm font-bold tabular-nums ${diffColor(diff)}`}>
              {diff >= 0 ? '+' : ''}{fmt(diff)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-500">
            <Clock size={11} />{duration}
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <InfoCell label="Apertura" value={new Date(shift.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} />
            <InfoCell label="Cierre" value={shift.endTime ? new Date(shift.endTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoCell label="Base inicial" value={fmt(shift.initialAmount)} />
            <InfoCell label="Monto esperado" value={fmt(shift.expectedAmount)} />
            <InfoCell label="Monto declarado" value={fmt(shift.finalAmount)} />
            <InfoCell
              label="Diferencia"
              value={`${diff >= 0 ? '+' : ''}${fmt(diff)}`}
              highlight={diff === 0 ? 'neutral' : diff > 0 ? 'green' : 'red'}
            />
          </div>

          {meta?.paymentMethods && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Desglose por método de pago</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(meta.paymentMethods as Record<string, number>).map(([method, amount]) => (
                  <div key={method} className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{METHOD_LABELS[method] ?? method}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{fmt(amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta?.taxSummary && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex gap-6 text-sm">
              <span className="text-gray-500">Neto: <strong className="text-gray-900">{fmt(meta.taxSummary.totalNet)}</strong></span>
              <span className="text-gray-500">IVA 19%: <strong className="text-gray-900">{fmt(meta.taxSummary.totalIva)}</strong></span>
              <span className="text-gray-500">Bruto: <strong className="text-gray-900">{fmt(meta.taxSummary.totalGross)}</strong></span>
            </div>
          )}

          {shift.closedBy && (
            <p className="text-xs text-gray-400 mt-3">
              Cerrado por <span className="font-medium text-gray-600">{shift.closedBy.name || shift.closedBy.email}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' | 'neutral' }) {
  const valueClass = highlight === 'green' ? 'text-emerald-700 font-bold'
    : highlight === 'red' ? 'text-red-600 font-bold'
    : 'text-gray-900 font-semibold';
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────────

function ShiftHistoryTab({ tenantId }: { tenantId: string }) {
  const [history, setHistory] = useState<ShiftHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async (p: number, f: string, t: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenantId, page: String(p) });
      if (f) params.set('from', f);
      if (t) params.set('to', t);
      const { data } = await api.get(`/shifts/history?${params}`);
      setHistory(data);
    } catch {
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(page, from, to); }, []);

  const applyFilter = () => { setPage(1); load(1, from, to); };
  const clearFilter = () => { setFrom(''); setTo(''); setPage(1); load(1, '', ''); };
  const goPage = (p: number) => { setPage(p); load(p, from, to); };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            type="date" value={from}
            onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            type="date" value={to}
            onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={applyFilter}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Filtrar
        </button>
        {(from || to) && (
          <button onClick={clearFilter} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Limpiar
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <button onClick={() => load(page, from, to)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={13} />
          </button>
          {history && <span>{history.total} cierre{history.total !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />Cargando historial...
        </div>
      ) : !history || history.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
          <XCircle size={36} className="mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Sin cierres registrados</p>
          <p className="text-sm mt-1">
            {from || to ? 'Prueba con otro rango de fechas' : 'Los cierres de caja aparecerán aquí'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {history.data.map(shift => (
              <ShiftRow key={shift.id} shift={shift} />
            ))}
          </div>

          {/* Pagination */}
          {history.lastPage > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                Página {history.page} de {history.lastPage}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => goPage(page - 1)} disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => goPage(page + 1)} disabled={page >= history.lastPage}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function TreasuryPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  const { data: receivables, isLoading: loadingReceivables } = useTreasuryReceivables(tenantId);
  const { data: cashFlow, isLoading: loadingCashFlow } = useTreasuryCashFlow(tenantId);
  const { data: maturities, isLoading: loadingMaturities } = useTreasuryMaturities(tenantId);

  const totalCashFlow = cashFlow?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const loadingResumen = loadingReceivables || loadingCashFlow || loadingMaturities;

  const TABS = [
    { key: 'resumen' as Tab, label: 'Resumen', Icon: LayoutDashboard },
    { key: 'cierres' as Tab, label: 'Cierres de Caja', Icon: History },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tesorería</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Resumen */}
        {activeTab === 'resumen' && (
          loadingResumen ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" />Cargando...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  title="Cuentas por Cobrar"
                  value={formatCurrency(receivables?.total || 0)}
                  subtitle={`${receivables?.count || 0} créditos pendientes`}
                  icon={CreditCard}
                  color="bg-blue-50 text-blue-600"
                />
                <KpiCard
                  title="Flujo de Caja (Hoy)"
                  value={formatCurrency(totalCashFlow)}
                  subtitle="Ingresos del día"
                  icon={TrendingUp}
                  color="bg-emerald-50 text-emerald-600"
                />
                <KpiCard
                  title="Próximos Vencimientos"
                  value={String(maturities?.length ?? 0)}
                  subtitle="En los próximos 7 días"
                  icon={Calendar}
                  color="bg-amber-50 text-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Flujo de Caja — Hoy</h2>
                  <div className="space-y-3">
                    {!cashFlow?.length ? (
                      <p className="text-sm text-gray-400">No hay movimientos hoy.</p>
                    ) : cashFlow.map(item => (
                      <div key={item.method} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{METHOD_LABELS[item.method] ?? item.method}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {cashFlow && cashFlow.length > 0 && (
                      <div className="pt-2 flex justify-between text-sm font-bold text-gray-900">
                        <span>Total</span>
                        <span>{formatCurrency(totalCashFlow)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Vencimientos Próximos (7 días)</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                          <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vence</th>
                          <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {!maturities?.length ? (
                          <tr><td colSpan={3} className="py-6 text-center text-gray-400">No hay vencimientos próximos.</td></tr>
                        ) : maturities.map(credit => (
                          <tr key={credit.id}>
                            <td className="py-2.5 text-gray-800 font-medium">{credit.customer.name}</td>
                            <td className="py-2.5 text-gray-500">{credit.dueDate ? formatDate(credit.dueDate) : '—'}</td>
                            <td className="py-2.5 text-right font-semibold text-red-600">{formatCurrency(credit.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Tab: Cierres */}
        {activeTab === 'cierres' && tenantId && (
          <ShiftHistoryTab tenantId={tenantId} />
        )}
      </div>
    </DashboardLayout>
  );
}
