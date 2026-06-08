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
  if (diff > 0) return 'text-[#10B981]';
  if (diff < 0) return 'text-red-400';
  return 'text-gray-400';
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
    <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-1.5 text-2xl font-black text-white font-mono tracking-tight">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${color}`}>
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
    <div className="border border-[rgba(0,212,255,0.08)] bg-[rgba(15,22,36,0.3)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-transparent hover:bg-[rgba(0,212,255,0.02)] transition-colors text-left"
      >
        <div className="flex-shrink-0">
          {diff === 0
            ? <CheckCircle2 size={16} className="text-gray-500" />
            : diff > 0
              ? <CheckCircle2 size={16} className="text-[#10B981]" />
              : <AlertCircle size={16} className="text-red-400" />}
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 min-w-0">
          <div>
            <p className="text-xs text-gray-500">Fecha</p>
            <p className="text-sm font-semibold text-white font-mono">
              {new Date(shift.startTime).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sucursal</p>
            <p className="text-sm font-medium text-gray-300 truncate">{shift.branch.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cajero</p>
            <p className="text-sm font-medium text-gray-300 truncate">{shift.openedBy.name || shift.openedBy.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total ventas</p>
            <p className="text-sm font-bold text-white font-mono">{fmt(meta?.totalSales)}</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Diferencia</p>
            <p className={`text-sm font-bold tabular-nums font-mono ${diffColor(diff)}`}>
              {diff >= 0 ? '+' : ''}{fmt(diff)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)] text-xs text-gray-400">
            <Clock size={11} />{duration}
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[rgba(0,212,255,0.08)] bg-[rgba(0,212,255,0.01)] px-5 py-4">
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
                  <div key={method} className="bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] rounded-lg px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{METHOD_LABELS[method] ?? method}</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">{fmt(amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta?.taxSummary && (
            <div className="bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] rounded-lg px-4 py-3 flex gap-6 text-sm">
              <span className="text-gray-400">Neto: <strong className="text-white font-mono">{fmt(meta.taxSummary.totalNet)}</strong></span>
              <span className="text-gray-400">IVA 19%: <strong className="text-white font-mono">{fmt(meta.taxSummary.totalIva)}</strong></span>
              <span className="text-gray-400">Bruto: <strong className="text-white font-mono">{fmt(meta.taxSummary.totalGross)}</strong></span>
            </div>
          )}

          {shift.closedBy && (
            <p className="text-xs text-gray-500 mt-3">
              Cerrado por <span className="font-medium text-gray-300">{shift.closedBy.name || shift.closedBy.email}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' | 'neutral' }) {
  const valueClass = highlight === 'green' ? 'text-[#10B981] font-bold font-mono'
    : highlight === 'red' ? 'text-red-400 font-bold font-mono'
    : 'text-white font-semibold';
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
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
      <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md shadow-sm p-4 flex flex-wrap items-end gap-3 rounded-xl">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Desde</label>
          <input
            type="date" value={from}
            onChange={e => setFrom(e.target.value)}
            className="border border-[rgba(0,212,255,0.15)] bg-[rgba(15,22,36,0.8)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Hasta</label>
          <input
            type="date" value={to}
            onChange={e => setTo(e.target.value)}
            className="border border-[rgba(0,212,255,0.15)] bg-[rgba(15,22,36,0.8)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] font-mono"
          />
        </div>
        <button
          onClick={applyFilter}
          className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] text-sm font-semibold rounded-lg transition-all"
        >
          Filtrar
        </button>
        {(from || to) && (
          <button onClick={clearFilter} className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Limpiar
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          <button onClick={() => load(page, from, to)} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={13} />
          </button>
          {history && <span>{history.total} cierre{history.total !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin text-[#00D4FF]" />Cargando historial...
        </div>
      ) : !history || history.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] rounded-xl">
          <XCircle size={36} className="mb-3 opacity-30 text-gray-500" />
          <p className="font-semibold text-gray-400">Sin cierres registrados</p>
          <p className="text-xs text-gray-500 mt-1">
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
              <p className="text-xs text-gray-500">
                Página {history.page} de {history.lastPage}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => goPage(page - 1)} disabled={page <= 1}
                  className="p-2 rounded-lg border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40 text-white transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => goPage(page + 1)} disabled={page >= history.lastPage}
                  className="p-2 rounded-lg border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40 text-white transition-colors"
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
          <h1 className="text-2xl font-bold text-white">Tesorería</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-[rgba(0,212,255,0.08)]">
          <nav className="flex gap-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${activeTab === key
                    ? 'border-[#00D4FF] text-[#00D4FF]'
                    : 'border-transparent text-gray-400 hover:text-white'}`}
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
              <Loader2 size={20} className="animate-spin text-[#00D4FF]" />Cargando...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  title="Cuentas por Cobrar"
                  value={formatCurrency(receivables?.total || 0)}
                  subtitle={`${receivables?.count || 0} créditos pendientes`}
                  icon={CreditCard}
                  color="bg-[rgba(59,130,246,0.06)] text-blue-400 border border-[rgba(59,130,246,0.15)]"
                />
                <KpiCard
                  title="Flujo de Caja (Hoy)"
                  value={formatCurrency(totalCashFlow)}
                  subtitle="Ingresos del día"
                  icon={TrendingUp}
                  color="bg-[rgba(0,212,255,0.06)] text-[#00D4FF] border border-[rgba(0,212,255,0.15)]"
                />
                <KpiCard
                  title="Próximos Vencimientos"
                  value={String(maturities?.length ?? 0)}
                  subtitle="En los próximos 7 días"
                  icon={Calendar}
                  color="bg-[rgba(245,158,11,0.06)] text-[#F59E0B] border border-[rgba(245,158,11,0.15)]"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md shadow-sm p-5 rounded-xl">
                  <h2 className="text-sm font-semibold text-[#00D4FF] uppercase tracking-wider mb-4">Flujo de Caja — Hoy</h2>
                  <div className="space-y-3">
                    {!cashFlow?.length ? (
                      <p className="text-sm text-gray-500">No hay movimientos hoy.</p>
                    ) : cashFlow.map(item => (
                      <div key={item.method} className="flex justify-between items-center border-b border-[rgba(0,212,255,0.05)] pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-gray-500" />
                          <span className="text-sm font-medium text-gray-300">{METHOD_LABELS[item.method] ?? item.method}</span>
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {cashFlow && cashFlow.length > 0 && (
                      <div className="pt-2 flex justify-between text-sm font-bold text-white border-t border-[rgba(0,212,255,0.08)]">
                        <span>Total</span>
                        <span className="font-mono text-[#00D4FF]">{formatCurrency(totalCashFlow)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md shadow-sm p-5 rounded-xl">
                  <h2 className="text-sm font-semibold text-[#00D4FF] uppercase tracking-wider mb-4">Vencimientos Próximos (7 días)</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(0,212,255,0.08)]">
                          <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                          <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">Vence</th>
                          <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(0,212,255,0.05)]">
                        {!maturities?.length ? (
                          <tr><td colSpan={3} className="py-6 text-center text-gray-500">No hay vencimientos próximos.</td></tr>
                        ) : maturities.map(credit => (
                          <tr key={credit.id}>
                            <td className="py-2.5 text-white font-semibold">{credit.customer.name}</td>
                            <td className="py-2.5 text-gray-400 font-mono">{credit.dueDate ? formatDate(credit.dueDate) : '—'}</td>
                            <td className="py-2.5 text-right font-bold text-red-400 font-mono">{formatCurrency(credit.balance)}</td>
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
