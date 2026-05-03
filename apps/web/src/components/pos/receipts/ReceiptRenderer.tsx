import React from 'react';
import { renderToString } from 'react-dom/server';
import { Sale } from '@/api/sales';
import { Ticket80mm } from './Ticket80mm';
import { Ticket50mm } from './Ticket50mm';
import { InvoiceA4 } from './InvoiceA4';
import { printThroughIframe } from '@/utils/print';
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
        case '50mm':
            return <Ticket50mm sale={sale} />;
        case 'A4':
            return <InvoiceA4 sale={sale} />;
        default:
            return <Ticket80mm sale={sale} tenant={tenant ?? undefined} />;
    }
};

export async function printSaleAction(sale: Sale, format: PrintFormat, tenant?: Tenant | null) {
    let html = '';

    try {
        if (format === '80mm') {
            html = renderToString(<Ticket80mm sale={sale} tenant={tenant ?? undefined} />);
        } else if (format === '50mm') {
            html = renderToString(<Ticket50mm sale={sale} />);
        } else if (format === 'A4') {
            html = renderToString(<InvoiceA4 sale={sale} />);
        }
    } catch (e) {
        console.error('Error rendering receipt to string', e);
        return;
    }

    if (html) {
        // Add minimal wrapper for the iframe
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Ticket ${sale.id}</title>
                    <style>
                        body { margin: 0; padding: 0; background: #fff; }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
            </html>
        `;
        await printThroughIframe(fullHtml);
    }
}
