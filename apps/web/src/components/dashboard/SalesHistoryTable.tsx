import { openDtePdf, openInternalReceiptPdf } from '../../api/dte-config';
import { usePrintSettings } from '../../hooks/usePrintSettings';
import toast from 'react-hot-toast';
import { Eye, FileX, ReceiptText, RefreshCw, Trash2 } from 'lucide-react';
import type { SaleRecord } from '../../services/sales.service';
import {
    formatSaleDate,
    formatCLP,
    formatPaymentMethods,
    resolvePdfUrl,
} from '../../services/sales.service';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    cyan:    '#0099CC',
    cyanA:   (a: number) => `rgba(0,153,204,${a})`,
    green:   '#34D399',
    greenA:  (a: number) => `rgba(52,211,153,${a})`,
    red:     '#F87171',
    redA:    (a: number) => `rgba(248,113,113,${a})`,
    amber:   '#F59E0B',
    amberA:  (a: number) => `rgba(245,158,11,${a})`,
    violet:  '#A78BFA',
    violetA: (a: number) => `rgba(167,139,250,${a})`,
    text: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted-foreground))',
    subtle:  'hsl(var(--muted-foreground))',
};

// ── DTE type badge ─────────────────────────────────────────────────────────────
function DteTypeBadge({ dteType }: { dteType: number }) {
    const map: Record<number, { label: string; color: string; alpha: (a: number) => string }> = {
        0: { label: 'Interno', color: C.cyan, alpha: C.cyanA },
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
    if (status === 'PENDING_CREDIT_NOTE' || status === 'CREDIT_NOTE') return <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-500">{status === 'CREDIT_NOTE' ? 'Nota de crédito confirmada' : 'Nota de crédito pendiente'}</span>;
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
                    <div className="h-3.5 rounded-lg" style={{ background: 'rgba(0,153,204,0.06)', width: `${55 + (i % 3) * 15}%` }} />
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
                    <FileX className="w-10 h-10" style={{ color: C.cyanA(0.35) }} />
                    <p className="text-sm font-semibold" style={{ color: C.muted }}>No hay ventas registradas</p>
                    <p className="text-xs" style={{ color: C.muted }}>Ajusta los filtros o realiza una venta en el POS.</p>
                </div>
            </td>
        </tr>
    );
}

// ── Main table ─────────────────────────────────────────────────────────────────
interface SalesHistoryTableProps {
    sales:                 SaleRecord[];
    isLoading:             boolean;
    onCreditNote?:    (saleId: string) => void;
    onDeleteInternalSale?: (saleId: string) => void;
    deletingSaleId?:       string | null;
    userRole?:             string;
}

const COLS = ['Folio / ID', 'Fecha y Hora', 'Sucursal', 'Método de Pago', 'Total', 'Estado', 'Acciones'];

export function SalesHistoryTable({ sales, isLoading, onCreditNote, onDeleteInternalSale, deletingSaleId, userRole }: SalesHistoryTableProps) {
    const { defaultFormat } = usePrintSettings();
    const handleViewPdf = (sale: SaleRecord) => {
        if (sale.dteVerifiedAt && sale.dteProviderId) { openDtePdf('/sales/' + sale.id + '/dte/pdf', defaultFormat).catch(() => toast.error('No se pudo consultar la boleta.')); return; }
        const url = sale.internalReceiptUrl;
        if (url) openInternalReceiptPdf(sale.id).catch(() => toast.error('No se pudo consultar el ticket interno.'));
    };

    const getPdfLabel = (sale: SaleRecord): string => {
        if (!sale.dteVerifiedAt || !sale.dteProviderId) return 'Ver Ticket';
        const labels: Record<number, string> = { 39: 'Ver Boleta', 33: 'Ver Factura', 52: 'Ver Guía', 61: 'Ver NC' };
        return labels[sale.dteType ?? 39] ?? 'Ver DTE';
    };

    const renderActions = (sale: SaleRecord) => {
        const pdfAvailable = !!resolvePdfUrl(sale);
        const isAdmin = ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(userRole || '');
        const canReviewNC = isAdmin && !!onCreditNote && (([33, 39].includes(sale.dteType ?? 39) && ['COMPLETED', 'CANCELLED'].includes(sale.status)) || sale.dteType === 61 && !!sale.originalSaleId);
        const canDeleteInternal = sale.status === 'COMPLETED' && !sale.dteFolio && ['INTERNO', 'PENDING', 'BLOQUEADO'].includes(sale.dteStatus || 'PENDING') && isAdmin && !!onDeleteInternalSale;
        const actionClass = 'inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40';
        const documentLabel = getPdfLabel(sale);
        return <div className="flex items-center justify-end gap-2" role="group" aria-label="Acciones de la venta">
            <button
                type="button"
                onClick={() => handleViewPdf(sale)}
                disabled={!pdfAvailable}
                aria-label={documentLabel}
                title={pdfAvailable ? documentLabel : 'Documento no disponible'}
                className={actionClass + ' border-cyan-500/20 bg-cyan-500/5 text-cyan-700 dark:text-cyan-400 enabled:hover:border-cyan-500/40 enabled:hover:bg-cyan-500/15'}>
                <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{documentLabel.replace(/^Ver /, '')}</span>
            </button>
            {canReviewNC && <button
                type="button"
                onClick={() => onCreditNote!(sale.dteType === 61 ? sale.originalSaleId! : sale.id)}
                title="Revisar nota de crédito"
                className={actionClass + ' border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/20'}>
                <ReceiptText className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{sale.dteType === 61 ? 'Ver nota de crédito' : 'Nota de crédito'}</span>
            </button>}
            {canDeleteInternal && <button
                type="button"
                onClick={() => {
                    if (window.confirm('¿Estás seguro de que deseas eliminar esta venta de control interno? Se devolverá el stock y el dinero de caja.')) onDeleteInternalSale!(sale.id);
                }}
                disabled={deletingSaleId === sale.id}
                aria-label="Eliminar venta de control interno"
                title="Eliminar venta de control interno"
                className={actionClass + ' !w-9 !px-0 border-red-500/15 text-red-600 dark:text-red-400 enabled:hover:border-red-500/40 enabled:hover:bg-red-500/10'}>
                {deletingSaleId === sale.id ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </button>}
        </div>;
    };

    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="hidden overflow-x-auto xl:block">
                <table className="w-full text-[13px]">
                    {/* ── thead ── */}
                    <thead>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            {COLS.map(col => (
                                <th key={col}
                                    className={'px-3 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ' + (col === 'Acciones' ? 'w-px !text-right' : '')}
                                    style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}>
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
                                const isEven       = idx % 2 === 0;

                                return (
                                    <tr key={sale.id}
                                        style={{ borderBottom: '1px solid hsl(var(--border))', background: isEven ? 'transparent' : 'hsl(var(--muted) / 0.4)' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,153,204,0.04)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isEven ? 'transparent' : 'hsl(var(--muted) / 0.4)'}>

                                        {/* Folio / ID */}
                                        <td className="px-3 py-3.5 whitespace-nowrap font-mono">
                                            <div className="flex items-center gap-2">
                                                {sale.dteFolio ? (
                                                    <span className="font-bold" style={{ color: C.cyan }}>#{sale.dteFolio}</span>
                                                ) : (
                                                    <span className="text-[12px]" style={{ color: C.muted }} title={sale.id}>
                                                        {sale.id.slice(0, 8)}…
                                                    </span>
                                                )}
                                                {sale.offlineReceipt ? <span className="text-xs" title={sale.offlineReceipt}>Contingencia</span> : <DteTypeBadge dteType={sale.dteType ?? 39} />}
                                                {sale.offlineId && <span className="text-[10px] text-muted-foreground">Sin conexi?n</span>}
                                                {sale.dteFolio && !sale.dteVerifiedAt && <span className="text-[10px] text-amber-500">Sin confirmar en el servicio de facturación</span>}
                                            </div>
                                        </td>

                                        {/* Fecha y Hora */}
                                        <td className="px-3 py-3.5 whitespace-nowrap text-xs" style={{ color: C.muted }}>
                                            {formatSaleDate(sale.createdAt)}
                                        </td>

                                        {/* Sucursal */}
                                        <td className="px-3 py-3.5 whitespace-nowrap" style={{ color: C.text }}>
                                            {sale.branch?.name ?? <span style={{ color: C.subtle }}>—</span>}
                                        </td>

                                        {/* Método de Pago */}
                                        <td className="px-3 py-3.5 whitespace-nowrap" style={{ color: C.muted }}>
                                            {formatPaymentMethods(sale.payments)}
                                        </td>

                                        {/* Total */}
                                        <td className="px-3 py-3.5 whitespace-nowrap font-bold tabular-nums" style={{ color: C.text }}>
                                            {formatCLP(sale.total)}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-3 py-3.5 whitespace-nowrap">
                                            <StatusBadge status={sale.status} />
                                        </td>

                                        {/* Acciones */}
                                        <td className="w-px whitespace-nowrap px-3 py-3.5">
                                            {renderActions(sale)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-border xl:hidden">
                {isLoading ? <p className="p-6 text-sm text-muted-foreground">Cargando ventas...</p> : !sales.length ? <p className="p-6 text-sm text-muted-foreground">No hay ventas registradas. Ajusta los filtros o realiza una venta en el POS.</p> : sales.map(sale => <article key={sale.id} aria-label={'Venta ' + (sale.dteFolio || sale.id.slice(0, 8))} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{sale.dteFolio ? '#' + sale.dteFolio : sale.id.slice(0, 8) + '…'}</span>{sale.offlineReceipt ? <span className="text-xs" title={sale.offlineReceipt}>Contingencia</span> : <DteTypeBadge dteType={sale.dteType ?? 39} />}
                                                {sale.offlineId && <span className="text-[10px] text-muted-foreground">Sin conexi?n</span>}</div><strong className="text-sm tabular-nums">{formatCLP(sale.total)}</strong></div>
                    <p className="text-xs text-muted-foreground">{formatSaleDate(sale.createdAt)} · {sale.branch?.name || 'Sin sucursal'}</p>
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={sale.status} />{sale.dteFolio && !sale.dteVerifiedAt && <span className="text-xs text-amber-500">Sin confirmar en el servicio de facturación</span>}</div>
                    {renderActions(sale)}
                </article>)}
            </div>

            {/* Footer count */}
            {sales.length > 0 && !isLoading && (
                <div className="px-5 py-3 text-[11px] text-right"
                    style={{ borderTop: '1px solid hsl(var(--border))', color: C.muted }}>
                    {sales.length} registro{sales.length !== 1 ? 's' : ''} encontrado{sales.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
