import React from 'react';
import { renderToString } from 'react-dom/server';
import { Sale } from '@/api/sales';
import { Ticket80mm } from './Ticket80mm';
import { Ticket58mm } from './Ticket58mm';
import { InvoiceA4 } from './InvoiceA4';
import { printThroughIframe, printWithQz, isQzConnected } from '@/utils/print';
import { PrintFormat } from '@/hooks/usePrintSettings';
import { Tenant } from '@nexopos/shared';

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
 * Retorna true si la URL apunta a un PDF oficial de Lioren (no es un mock).
 */
export function isRealDtePdf(url?: string | null): boolean {
    if (!url) return false;
    if (url.includes('ejemplo-mock')) return false;
    // Lioren real PDFs come from lioren.cl or a real endpoint
    return true;
}

/**
 * Acción de impresión principal del POS.
 *
 * Comportamiento:
 *  1. Si la venta tiene un PDF oficial de Lioren (DTE real), abre ese PDF en
 *     una nueva pestaña para que el usuario lo imprima desde el visor del navegador.
 *     El PDF ya incluye el TED (Timbre Electrónico Digital) requerido por el SII.
 *  2. En caso contrario (Comprobante de Venta o DTE mock), renderiza el ticket
 *     HTML y lo imprime vía QZ Tray (silencioso) o iframe (diálogo del SO).
 *
 * @param sale         - Datos de la venta
 * @param format       - Formato de ticket ('80mm' | '58mm' | 'A4')
 * @param tenant       - Datos del tenant (nombre, RUT, etc.)
 * @param printerName  - Nombre de la impresora en QZ Tray (vacío → fallback)
 * @param useQzTray    - Si false, siempre usa fallback iframe
 */
export async function printSaleAction(
    sale: Sale,
    format: PrintFormat,
    tenant?: Tenant | null,
    printerName?: string,
    useQzTray?: boolean,
): Promise<void> {
    // ── 1. Si hay PDF oficial del DTE, abrir en nueva pestaña (tiene TED) ──
    if (isRealDtePdf(sale.dtePdfUrl)) {
        window.open(sale.dtePdfUrl!, '_blank', 'noopener,noreferrer');
        return;
    }

    // ── 2. Fallback: renderizar ticket HTML (Comprobante de Venta o mock DTE) ──
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

    // ── Intentar impresión silenciosa con QZ Tray ──
    const shouldUseQz = useQzTray !== false && printerName && isQzConnected();

    if (shouldUseQz) {
        try {
            console.log(`[QZ Tray] Imprimiendo en "${printerName}" formato ${format}`);
            await printWithQz(html, printerName!, format === 'A4' ? 'A4' : format);
            return; // éxito silencioso
        } catch (err) {
            console.warn('[QZ Tray] Falló la impresión silenciosa, usando fallback iframe:', err);
            // continúa al fallback
        }
    }

    // ── Fallback: diálogo del navegador ──
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
