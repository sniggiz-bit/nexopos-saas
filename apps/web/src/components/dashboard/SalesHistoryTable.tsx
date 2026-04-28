import { Eye, FileX, ReceiptText, RefreshCw } from 'lucide-react';
import type { SaleRecord } from '../../services/sales.service';
import {
    formatSaleDate,
    formatCLP,
    formatPaymentMethods,
    resolvePdfUrl,
} from '../../services/sales.service';

// ─────────────────────────────────────────────
// DTE type badge
// ─────────────────────────────────────────────

function DteTypeBadge({ dteType }: { dteType: number }) {
    const map: Record<number, { label: string; cls: string }> = {
        39: { label: 'Boleta', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
        33: { label: 'Factura', cls: 'bg-green-50 text-green-700 border-green-200' },
        52: { label: 'G. Despacho', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
        61: { label: 'Nota Créd.', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    };
    const info = map[dteType];
    if (!info) return null;
    return (
        <span className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded border ${info.cls}`}>
            {info.label}
        </span>
    );
}

// ─────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: SaleRecord['status'] }) {
    if (status === 'COMPLETED') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Completada
            </span>
        );
    }
    if (status === 'CANCELLED') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Anulada
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            Pre-venta
        </span>
    );
}

// ─────────────────────────────────────────────
// Skeleton row (loading state)
// ─────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

function EmptyState() {
    return (
        <tr>
            <td colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                    <FileX className="w-12 h-12 text-gray-300" />
                    <p className="text-base font-medium">No hay ventas registradas</p>
                    <p className="text-sm">Ajusta los filtros o realiza una venta en el POS.</p>
                </div>
            </td>
        </tr>
    );
}

// ─────────────────────────────────────────────
// Main table
// ─────────────────────────────────────────────

interface SalesHistoryTableProps {
    sales: SaleRecord[];
    isLoading: boolean;
    onEmitNotaCredito?: (saleId: string) => void;
    emittingNcId?: string | null;
}

export function SalesHistoryTable({
    sales,
    isLoading,
    onEmitNotaCredito,
    emittingNcId,
}: SalesHistoryTableProps) {
    const handleViewPdf = (sale: SaleRecord) => {
        const pdfUrl = resolvePdfUrl(sale);
        if (!pdfUrl) return;
        const apiUrl = import.meta.env.VITE_API_URL ?? '';
        const fullUrl = pdfUrl.startsWith('/api/') ? `${apiUrl}${pdfUrl}` : pdfUrl;
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
    };

    const getPdfLabel = (sale: SaleRecord): string => {
        if (!sale.dtePdfUrl || sale.dtePdfUrl.includes('ejemplo-mock')) return 'Ver Ticket';
        const labels: Record<number, string> = {
            39: 'Ver Boleta',
            33: 'Ver Factura',
            52: 'Ver Guía',
            61: 'Ver NC',
        };
        return labels[sale.dteType ?? 39] ?? 'Ver DTE';
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                    <tr className="bg-gray-50 text-left">
                        {[
                            'Folio / ID',
                            'Fecha y Hora',
                            'Sucursal',
                            'Método de Pago',
                            'Total',
                            'Estado',
                            'Acciones',
                        ].map((col) => (
                            <th
                                key={col}
                                className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                        <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </>
                    ) : sales.length === 0 ? (
                        <EmptyState />
                    ) : (
                        sales.map((sale) => {
                            const pdfAvailable = !!resolvePdfUrl(sale);
                            const canEmitNC =
                                sale.status === 'COMPLETED' &&
                                !!sale.dteFolio &&
                                !!onEmitNotaCredito;

                            return (
                                <tr
                                    key={sale.id}
                                    className="hover:bg-blue-50/40 transition-colors duration-100"
                                >
                                    {/* Folio / ID */}
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-700">
                                        <div className="flex items-center gap-2">
                                            {sale.dteFolio ? (
                                                <span className="font-semibold text-blue-700">
                                                    #{sale.dteFolio}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs" title={sale.id}>
                                                    {sale.id.slice(0, 8)}…
                                                </span>
                                            )}
                                            {sale.dteType && (
                                                <DteTypeBadge dteType={sale.dteType} />
                                            )}
                                        </div>
                                    </td>

                                    {/* Fecha y Hora */}
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {formatSaleDate(sale.createdAt)}
                                    </td>

                                    {/* Sucursal */}
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                        {sale.branch?.name ?? (
                                            <span className="text-gray-400 italic">—</span>
                                        )}
                                    </td>

                                    {/* Método de Pago */}
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {formatPaymentMethods(sale.payments)}
                                    </td>

                                    {/* Total */}
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                        {formatCLP(sale.total)}
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={sale.status} />
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 justify-end">
                                            {/* PDF button */}
                                            <button
                                                onClick={() => handleViewPdf(sale)}
                                                disabled={!pdfAvailable}
                                                title={pdfAvailable ? 'Abrir documento' : 'Documento no disponible'}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                                           text-blue-600 hover:bg-blue-50 border border-blue-200
                                                           disabled:opacity-40 disabled:cursor-not-allowed
                                                           transition-colors duration-150"
                                            >
                                                {sale.dteFolio ? (
                                                    <ReceiptText className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Eye className="w-3.5 h-3.5" />
                                                )}
                                                {getPdfLabel(sale)}
                                            </button>

                                            {/* Nota de Crédito button */}
                                            {canEmitNC && (
                                                <button
                                                    onClick={() => onEmitNotaCredito!(sale.id)}
                                                    disabled={emittingNcId === sale.id}
                                                    title="Emitir Nota de Crédito"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                                               text-orange-600 hover:bg-orange-50 border border-orange-200
                                                               disabled:opacity-40 disabled:cursor-not-allowed
                                                               transition-colors duration-150"
                                                >
                                                    {emittingNcId === sale.id ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <ReceiptText className="w-3.5 h-3.5" />
                                                    )}
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
    );
}
