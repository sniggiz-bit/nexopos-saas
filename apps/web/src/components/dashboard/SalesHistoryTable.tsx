import { Eye, FileX, ReceiptText, RefreshCw } from 'lucide-react';
import type { SaleRecord } from '../../services/sales.service';
import {
    formatSaleDate,
    formatCLP,
    formatPaymentMethods,
    resolvePdfUrl,
} from '../../services/sales.service';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    cyan:    '#00D4FF',
    cyanA:   (a: number) => `rgba(0,212,255,${a})`,
    green:   '#34D399',
    greenA:  (a: number) => `rgba(52,211,153,${a})`,
    red:     '#F87171',
    redA:    (a: number) => `rgba(248,113,113,${a})`,
    amber:   '#F59E0B',
    amberA:  (a: number) => `rgba(245,158,11,${a})`,
    violet:  '#A78BFA',
    violetA: (a: number) => `rgba(167,139,250,${a})`,
    text:    'rgba(210,225,245,0.9)',
    muted:   'rgba(180,195,220,0.45)',
    subtle:  'rgba(180,195,220,0.25)',
};

// ── DTE type badge ─────────────────────────────────────────────────────────────
function DteTypeBadge({ dteType }: { dteType: number }) {
    const map: Record<number, { label: string; color: string; alpha: (a: number) => string }> = {
        39: { label: 'Boleta',      color: C.cyan,   alpha: C.cyanA   },
        33: { label: 'Factura',     color: C.green,  alpha: C.greenA  },
        52: { label: 'G.Despacho',  color: C.violet, alpha: C.violetA },
        61: { label: 'Nota Créd.',  color: C.amber,  alpha: C.amberA  },
    };
    const info = map[dteType];
    if (!info) return null;
    return (
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide"
            style={{ background: info.alpha(0.12), color: info.color, border: `1px solid ${info.alpha(0.25)}` }}>
            {info.label}
        </span>
    );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SaleRecord['status'] }) {
    if (status === 'COMPLETED') return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: C.greenA(0.1), color: C.green, border: `1px solid ${C.greenA(0.2)}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green, boxShadow: `0 0 4px ${C.green}` }} />
            Completada
        </span>
    );
    if (status === 'CANCELLED') return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: C.redA(0.1), color: C.red, border: `1px solid ${C.redA(0.2)}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.red, boxShadow: `0 0 4px ${C.red}` }} />
            Anulada
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: C.amberA(0.1), color: C.amber, border: `1px solid ${C.amberA(0.2)}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.amber, boxShadow: `0 0 4px ${C.amber}` }} />
            Pre-venta
        </span>
    );
}

// ── Skeleton row ───────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-5 py-4">
                    <div className="h-3.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.06)', width: `${55 + (i % 3) * 15}%` }} />
                </td>
            ))}
        </tr>
    );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <tr>
            <td colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileX className="w-10 h-10" style={{ color: C.cyanA(0.2) }} />
                    <p className="text-sm font-semibold" style={{ color: C.subtle }}>No hay ventas registradas</p>
                    <p className="text-xs" style={{ color: C.cyanA(0.3) }}>Ajusta los filtros o realiza una venta en el POS.</p>
                </div>
            </td>
        </tr>
    );
}

// ── Main table ─────────────────────────────────────────────────────────────────
interface SalesHistoryTableProps {
    sales:              SaleRecord[];
    isLoading:          boolean;
    onEmitNotaCredito?: (saleId: string) => void;
    emittingNcId?:      string | null;
}

const COLS = ['Folio / ID', 'Fecha y Hora', 'Sucursal', 'Método de Pago', 'Total', 'Estado', 'Acciones'];

export function SalesHistoryTable({ sales, isLoading, onEmitNotaCredito, emittingNcId }: SalesHistoryTableProps) {
    const handleViewPdf = (sale: SaleRecord) => {
        const pdfUrl = resolvePdfUrl(sale);
        if (!pdfUrl) return;
        const apiUrl  = import.meta.env.VITE_API_URL ?? '';
        const fullUrl = pdfUrl.startsWith('/api/') ? `${apiUrl}${pdfUrl}` : pdfUrl;
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
    };

    const getPdfLabel = (sale: SaleRecord): string => {
        if (!sale.dtePdfUrl || sale.dtePdfUrl.includes('ejemplo-mock')) return 'Ver Ticket';
        const labels: Record<number, string> = { 39: 'Ver Boleta', 33: 'Ver Factura', 52: 'Ver Guía', 61: 'Ver NC' };
        return labels[sale.dteType ?? 39] ?? 'Ver DTE';
    };

    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-[13px]">
                    {/* ── thead ── */}
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.07)' }}>
                            {COLS.map(col => (
                                <th key={col}
                                    className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                                    style={{ color: 'rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.03)' }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* ── tbody ── */}
                    <tbody>
                        {isLoading ? (
                            <>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</>
                        ) : sales.length === 0 ? (
                            <EmptyState />
                        ) : (
                            sales.map((sale, idx) => {
                                const pdfAvailable = !!resolvePdfUrl(sale);
                                const canEmitNC    = sale.status === 'COMPLETED' && !!sale.dteFolio && !!onEmitNotaCredito;
                                const isEven       = idx % 2 === 0;

                                return (
                                    <tr key={sale.id}
                                        style={{ borderBottom: '1px solid rgba(0,212,255,0.05)', background: isEven ? 'transparent' : 'rgba(0,212,255,0.015)' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.04)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isEven ? 'transparent' : 'rgba(0,212,255,0.015)'}>

                                        {/* Folio / ID */}
                                        <td className="px-5 py-3.5 whitespace-nowrap font-mono">
                                            <div className="flex items-center gap-2">
                                                {sale.dteFolio ? (
                                                    <span className="font-bold" style={{ color: C.cyan }}>#{sale.dteFolio}</span>
                                                ) : (
                                                    <span className="text-[12px]" style={{ color: C.muted }} title={sale.id}>
                                                        {sale.id.slice(0, 8)}…
                                                    </span>
                                                )}
                                                {sale.dteType && <DteTypeBadge dteType={sale.dteType} />}
                                            </div>
                                        </td>

                                        {/* Fecha y Hora */}
                                        <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: C.muted }}>
                                            {formatSaleDate(sale.createdAt)}
                                        </td>

                                        {/* Sucursal */}
                                        <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: C.text }}>
                                            {sale.branch?.name ?? <span style={{ color: C.subtle }}>—</span>}
                                        </td>

                                        {/* Método de Pago */}
                                        <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: C.muted }}>
                                            {formatPaymentMethods(sale.payments)}
                                        </td>

                                        {/* Total */}
                                        <td className="px-5 py-3.5 whitespace-nowrap font-bold tabular-nums" style={{ color: C.text }}>
                                            {formatCLP(sale.total)}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <StatusBadge status={sale.status} />
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 justify-end">
                                                {/* PDF / Ticket */}
                                                <button
                                                    onClick={() => handleViewPdf(sale)}
                                                    disabled={!pdfAvailable}
                                                    title={pdfAvailable ? 'Abrir documento' : 'Documento no disponible'}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    style={{ background: C.cyanA(0.08), border: `1px solid ${C.cyanA(0.2)}`, color: C.cyan }}
                                                    onMouseEnter={e => !e.currentTarget.disabled && ((e.currentTarget as HTMLElement).style.background = C.cyanA(0.16))}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.08)}>
                                                    {sale.dteFolio ? <ReceiptText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    {getPdfLabel(sale)}
                                                </button>

                                                {/* Nota de Crédito */}
                                                {canEmitNC && (
                                                    <button
                                                        onClick={() => onEmitNotaCredito!(sale.id)}
                                                        disabled={emittingNcId === sale.id}
                                                        title="Emitir Nota de Crédito"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 disabled:opacity-50"
                                                        style={{ background: C.amberA(0.08), border: `1px solid ${C.amberA(0.25)}`, color: C.amber }}
                                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.amberA(0.16)}
                                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.amberA(0.08)}>
                                                        {emittingNcId === sale.id
                                                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            : <ReceiptText className="w-3.5 h-3.5" />}
                                                        NC
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer count */}
            {sales.length > 0 && !isLoading && (
                <div className="px-5 py-3 text-[11px] text-right"
                    style={{ borderTop: '1px solid rgba(0,212,255,0.07)', color: C.cyanA(0.35) }}>
                    {sales.length} registro{sales.length !== 1 ? 's' : ''} encontrado{sales.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
