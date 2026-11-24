import type { Sale } from '@/api/sales';
import { EscPosEncoder } from '@/utils/EscPosEncoder';
import type { Tenant } from '@nexopos/shared';
import { formatPrice } from '@/utils/formatters';
import { thermalColumns, wrapReceiptText, receiptAmountLine } from '@/utils/thermalLayout';
import type { ThermalFormat, ThermalOptions } from '@/utils/thermalLayout';

export function generateReceiptEscPos(sale: Sale, tenant?: Tenant, format: ThermalFormat = '80mm', options: ThermalOptions = {}): Uint8Array {
    const encoder = new EscPosEncoder();
    const columns = thermalColumns(format, options);
    const lines = (value: unknown, width = columns) => wrapReceiptText(value, width).forEach(line => encoder.line(line));
    const amount = (label: string, value: number) => receiptAmountLine(label, formatPrice(value), columns).forEach(line => encoder.line(line));
    encoder.initialize().printWidth(columns).align('center').bold(true).size(2, 2);
    lines(tenant?.name || 'NexoPOS', Math.floor(columns / 2));
    encoder.size(1, 1).bold(false);
    if (tenant?.rut) lines('RUT: ' + tenant.rut);
    if (tenant?.address) lines(tenant.address);
    if (tenant?.phone) lines('Tel: ' + tenant.phone);
    encoder.newline().bold(true);
    lines('COMPROBANTE INTERNO DE VENTA'); lines('NO ACREDITA EMISION DTE');
    encoder.bold(false); lines('Nro: ' + sale.id);
    lines('Fecha: ' + new Date(sale.createdAt).toLocaleString('es-CL'));
    encoder.newline().align('left').line('-'.repeat(columns));
    for (const item of sale.items || []) {
        encoder.bold(true); lines(item.product?.name || 'Item'); encoder.bold(false);
        amount(Number(item.quantity).toLocaleString('es-CL') + ' x ' + formatPrice(Number(item.price)), Number(item.price) * Number(item.quantity) - Number(item.discountAmount || 0));
        if (item.discountAmount) amount('Descuento item', Number(item.discountAmount));
    }
    encoder.line('-'.repeat(columns)).bold(true).size(1, 2); amount('TOTAL', Number(sale.total));
    encoder.size(1, 1).bold(false).newline();
    const paymentNames: Record<string, string> = { CASH: 'Efectivo', EFECTIVO: 'Efectivo', DEBIT: 'Debito', DEBITO: 'Debito', CARD: 'Tarjeta', CREDIT_CARD: 'Tarjeta credito', CREDIT: 'Credito', CREDITO: 'Credito', TRANSFER: 'Transferencia', TRANSFERENCIA: 'Transferencia', OTHER: 'Otro' };
    for (const payment of sale.payments || []) amount(paymentNames[payment.paymentMethod] || payment.paymentMethod, Number(payment.amount));
    const paid = (sale.payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (paid > Number(sale.total)) amount('Vuelto', paid - Number(sale.total));
    encoder.newline().align('center'); lines('Gracias por su compra!'); lines('Impulsado por NexoPOS');
    encoder.newline(4); if (options.cutPaper !== false) encoder.cut();
    return encoder.encode();
}
export function generatePrinterTest(format: ThermalFormat, options: ThermalOptions = {}): Uint8Array {
    const encoder = new EscPosEncoder(); const columns = thermalColumns(format, options);
    encoder.initialize().printWidth(columns).align('center').bold(true).line('NexoPOS').line('PRUEBA DE IMPRESION').bold(false).align('left');
    for (const line of wrapReceiptText('Formato: ' + format + ' / ' + columns + ' columnas', columns)) encoder.line(line);
    encoder.line('-'.repeat(columns));
    encoder.line(Array.from({ length: columns }, (_, i) => String((i + 1) % 10)).join(''));
    for (const line of wrapReceiptText('Producto con nombre largo para verificar el ajuste automatico al ancho del papel', columns)) encoder.line(line);
    for (const line of receiptAmountLine('TOTAL DE PRUEBA', '$123.456', columns)) encoder.line(line);
    for (const line of wrapReceiptText('SIN VENTA NI DOCUMENTO TRIBUTARIO', columns)) encoder.line(line);
    encoder.newline(4); if (options.cutPaper !== false) encoder.cut();
    return encoder.encode();
}
