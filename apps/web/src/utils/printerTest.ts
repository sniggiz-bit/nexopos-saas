import type { PrintFormat } from '@/hooks/usePrintSettings';
import { receiptAmountLine, thermalColumns, wrapReceiptText } from './thermalLayout';
import type { ThermalOptions } from './thermalLayout';

/** A sample print never creates a sale or a fiscal document. */
export function printerTestHtml(format: PrintFormat, options: ThermalOptions = {}): string {
    const columns = thermalColumns(format === '58mm' ? '58mm' : '80mm', options);
    const lines = [
        'NexoPOS', 'PRUEBA DE IMPRESION', '', 'Formato: ' + format,
        '-'.repeat(columns), Array.from({ length: columns }, (_, i) => String((i + 1) % 10)).join(''),
        ...wrapReceiptText('Producto de prueba con nombre largo para comprobar el ajuste al papel', columns),
        ...receiptAmountLine('TOTAL DE PRUEBA', '$123.456', columns),
        '-'.repeat(columns), ...wrapReceiptText('SIN VENTA NI DOCUMENTO TRIBUTARIO', columns),
    ];
    const escaped = lines.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const paper = format === 'A4' ? 'A4' : 'auto';
    const width = format === 'A4' ? '100%' : format;
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prueba de impresión NexoPOS</title><style>@media print{@page{size:' + paper + ';margin:0}html,body{margin:0}}</style></head><body style="margin:0;background:white;color:black;width:' + width + ';max-width:100%;padding:1.5mm;box-sizing:border-box"><pre style="margin:0;font:10px/1.5 Courier New,monospace;white-space:pre-wrap;overflow-wrap:anywhere">' + escaped + '</pre></body></html>';
}
