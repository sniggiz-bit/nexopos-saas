import { sendSaleToPrinter, SilentPrintError } from '@/utils/silentSalePrint';
import { DirectPrintWriteError, serialPrinter } from '@/utils/serialPrinter';
import React from 'react';
import { getDtePrintData, openDtePdf } from '@/api/dte-config';
import { renderToString } from 'react-dom/server';
import { Sale } from '@/api/sales';
import { Ticket80mm } from './Ticket80mm';
import { Ticket58mm } from './Ticket58mm';
import { InvoiceA4 } from './InvoiceA4';
import { printThroughIframe } from '@/utils/print';
import { PrintFormat } from '@/hooks/usePrintSettings';
import { Tenant } from '@nexopos/shared';
import type { ThermalOptions } from '@/utils/thermalLayout';

interface ReceiptRendererProps {
    sale: Sale;
    format: PrintFormat;
    tenant?: Tenant | null;
}

export const ReceiptRenderer: React.FC<ReceiptRendererProps> = ({ sale, format, tenant }) => {
    switch (format) {
        case '80mm':
            return <Ticket80mm sale={sale} tenant={tenant ?? undefined} />;
        case '58mm':
            return <Ticket58mm sale={sale} tenantName={tenant?.name} tenant={tenant || undefined} />;
        case 'A4':
            return <InvoiceA4 sale={sale} />;
        default:
            return <Ticket80mm sale={sale} tenant={tenant ?? undefined} />;
    }
};

/**
 * Retorna true si la URL apunta a un PDF verificado del sistema (no es un mock).
 */
export function isRealDtePdf(url?: string | null): boolean {
    if (!url) return false;
    if (url.includes('ejemplo-mock')) return false;
    return /^\/api\/sales\/[a-zA-Z0-9-]+\/dte\/pdf$/.test(url);
}

/**
 * Acción de impresión principal del POS.
 *
 * Comportamiento:
 * En modo directo envía el comprobante o la boleta con timbre al puerto conectado.
 * Los errores nunca cambian automáticamente al diálogo del sistema.
 * En modo sistema se conserva el PDF o el diálogo HTML.
 */
export async function printSaleAction(
    sale: Sale,
    format: PrintFormat,
    tenant?: Tenant | null,
    useWebSerial?: boolean,
    printBytes?: (data: Uint8Array) => Promise<boolean>,
    options: ThermalOptions = {},
): Promise<void> {
    if (useWebSerial && format !== 'A4') {
        if (!printBytes) throw new SilentPrintError('Venta guardada. Vincula una impresora directa y pulsa Reimprimir.');
        await sendSaleToPrinter(sale, format, tenant, options, { isReady: () => serialPrinter.getSnapshot().status === 'connected', write: printBytes }, getDtePrintData);
        return;
    }
    if (sale.dteVerifiedAt && sale.dteProviderId && isRealDtePdf(sale.dtePdfUrl)) {
        await openDtePdf('/sales/' + sale.id + '/dte/pdf', format);
        return;
    }

    // ── 3. Fallback: renderizar ticket HTML y usar diálogo del SO ──
    let html = '';
    try {
        if (format === '80mm') {
            html = renderToString(<Ticket80mm sale={sale} tenant={tenant ?? undefined} />);
        } else if (format === '58mm') {
            html = renderToString(<Ticket58mm sale={sale} tenantName={tenant?.name} tenant={tenant || undefined} />);
        } else if (format === 'A4') {
            html = renderToString(<InvoiceA4 sale={sale} />);
        }
    } catch (e) {
        console.error('[PrintSaleAction] Error rendering receipt to string:', e);
        return;
    }

    if (!html) return;

    const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Ticket ${sale.id}</title>
    <style>body { margin: 0; padding: 0; background: #fff; }</style>
  </head>
  <body>${html}</body>
</html>`;

    await printThroughIframe(fullHtml);
}

export function printSaleErrorMessage(error: unknown): string {
    return error instanceof DirectPrintWriteError || error instanceof SilentPrintError ? error.message : 'Venta guardada. No se pudo abrir el comprobante. Puedes volver a abrirlo desde Ventas.';
}
