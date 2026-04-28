import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { SalesHistoryTable } from '../../components/dashboard/SalesHistoryTable';
import { useSales } from '../../hooks/useSales';
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatCLP } from '../../services/sales.service';
import type { SaleStatus } from '../../services/sales.service';
import { emitNotaCredito } from '../../api/sales';
import {
    TrendingUp,
    ReceiptText,
    CalendarDays,
    Store,
    RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Filters {
    startDate: string;
    endDate: string;
    branchId: string;
    status: SaleStatus | '';
}

// ─────────────────────────────────────────────
// Summary card sub-component
// ─────────────────────────────────────────────

interface SummaryCardProps {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    accent: string; // Tailwind bg colour class for icon wrapper
}

function SummaryCard({ label, value, sub, icon, accent }: SummaryCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${accent} flex-shrink-0`}>{icon}</div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    {label}
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoISO(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export function SalesHistoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [filters, setFilters] = useState<Filters>({
        startDate: thirtyDaysAgoISO(),
        endDate: todayISO(),
        branchId: '',
        status: '',
    });

    // Fetch data
    const {
        data: salesRaw = [],
        isLoading,
        refetch,
        isFetching,
    } = useSales({
        filters: {
            startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
            endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
            branchId: filters.branchId || undefined,
            tenantId: user?.tenantId,
        },
    });

    const { branches } = useBranches();

    const { mutate: emitNC, isPending: isEmittingNC, variables: ncSaleId } = useMutation({
        mutationFn: (saleId: string) => emitNotaCredito(saleId),
        onSuccess: (data) => {
            if (data.success) {
                toast({
                    title: 'Nota de Crédito emitida',
                    description: data.folio ? `Folio #${data.folio}` : 'DTE emitido exitosamente',
                });
                refetch();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error al emitir NC',
                    description: data.error || 'No se pudo emitir la Nota de Crédito',
                });
            }
        },
        onError: () => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo emitir la Nota de Crédito',
            });
        },
    });

    // Client-side status filter (API doesn't always support it)
    const sales = useMemo(() => {
        if (!filters.status) return salesRaw;
        return salesRaw.filter((s) => s.status === filters.status);
    }, [salesRaw, filters.status]);

    // Summary metrics
    const totalRevenue = useMemo(
        () => sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + s.total, 0),
        [sales]
    );
    const completedCount = useMemo(
        () => sales.filter((s) => s.status === 'COMPLETED').length,
        [sales]
    );
    const cancelledCount = useMemo(
        () => sales.filter((s) => s.status === 'CANCELLED').length,
        [sales]
    );

    const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            startDate: thirtyDaysAgoISO(),
            endDate: todayISO(),
            branchId: '',
            status: '',
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Consulta, filtra y descarga tus boletas y tickets de venta.
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                                   border border-gray-200 bg-white text-gray-700 shadow-sm
                                   hover:bg-gray-50 disabled:opacity-60 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard
                        label="Ingresos (completadas)"
                        value={formatCLP(totalRevenue)}
                        sub={`${completedCount} ${completedCount === 1 ? 'venta' : 'ventas'}`}
                        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                        accent="bg-blue-50"
                    />
                    <SummaryCard
                        label="Ventas completadas"
                        value={completedCount.toString()}
                        icon={<ReceiptText className="w-5 h-5 text-green-600" />}
                        accent="bg-green-50"
                    />
                    <SummaryCard
                        label="Ventas anuladas"
                        value={cancelledCount.toString()}
                        icon={<ReceiptText className="w-5 h-5 text-red-500" />}
                        accent="bg-red-50"
                    />
                </div>

                {/* ── Filter Bar ── */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-end">

                        {/* Date from */}
                        <div className="flex flex-col gap-1 min-w-[160px]">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Desde
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                max={filters.endDate || todayISO()}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Date to */}
                        <div className="flex flex-col gap-1 min-w-[160px]">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                min={filters.startDate}
                                max={todayISO()}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Branch selector */}
                        <div className="flex flex-col gap-1 min-w-[180px]">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <Store className="w-3.5 h-3.5" />
                                Sucursal
                            </label>
                            <select
                                value={filters.branchId}
                                onChange={(e) => handleFilterChange('branchId', e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Todas las sucursales</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status selector */}
                        <div className="flex flex-col gap-1 min-w-[160px]">
                            <label className="text-xs font-medium text-gray-500">Estado</label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange('status', e.target.value as SaleStatus | '')
                                }
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Todos</option>
                                <option value="COMPLETED">Completada</option>
                                <option value="CANCELLED">Anulada</option>
                                <option value="PRE_SALE">Pre-venta</option>
                            </select>
                        </div>

                        {/* Reset */}
                        <button
                            onClick={handleResetFilters}
                            className="mt-auto px-4 py-2 text-sm font-medium rounded-lg
                                       border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ── Data Table ── */}
                <SalesHistoryTable
                    sales={sales}
                    isLoading={isLoading}
                    onEmitNotaCredito={(saleId) => emitNC(saleId)}
                    emittingNcId={isEmittingNC ? ncSaleId : null}
                />

            </div>
        </DashboardLayout>
    );
}
