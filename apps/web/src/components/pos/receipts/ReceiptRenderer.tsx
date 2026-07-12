import React from 'react';
import { renderToString } from 'react-dom/server';
import { Sale } from '@/api/sales';
import { Ticket80mm } from './Ticket80mm';
import { Ticket58mm } from './Ticket58mm';
import { InvoiceA4 } from './InvoiceA4';
import { printThroughIframe } from '@/utils/print';
import { PrintFormat } from '@/hooks/usePrintSettings';
import { Tenant } from '@nexopos/shared';
import { generateReceiptEscPos } from './ReceiptToEscPos';

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
 *  2. Si Web Serial está activo y disponible, genera código ESC/POS y lo envía por USB.
 *  3. En caso contrario, renderiza el ticket HTML y lo imprime vía iframe (diálogo del SO).
 */
export async function printSaleAction(
    sale: Sale,
    format: PrintFormat,
    tenant?: Tenant | null,
    useWebSerial?: boolean,
    printBytes?: (data: Uint8Array) => Promise<boolean>,
): Promise<void> {
    // ── 1. Si hay PDF oficial del DTE, abrir en nueva pestaña (tiene TED) ──
    if (isRealDtePdf(sale.dtePdfUrl)) {
        window.open(sale.dtePdfUrl!, '_blank', 'noopener,noreferrer');
        return;
    }

    // ── 2. Intentar impresión directa vía Web Serial API (ESC/POS) ──
    if (useWebSerial && printBytes && format !== 'A4') {
        try {
            console.log(`[Web Serial] Generando ESC/POS y enviando a impresora USB...`);
            const bytes = generateReceiptEscPos(sale, tenant || undefined);
            const success = await printBytes(bytes);
            if (success) {
                return; // éxito silencioso
            }
            console.warn('[Web Serial] Error o puerto no listo, cayendo a iframe...');
        } catch (err) {
            console.warn('[Web Serial] Falló la impresión directa, usando fallback iframe:', err);
        }
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
