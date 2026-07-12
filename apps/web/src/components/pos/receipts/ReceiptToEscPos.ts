import { Sale } from '@/api/sales';
import { EscPosEncoder } from '@/utils/EscPosEncoder';
import { Tenant } from '@nexopos/shared';
import { formatPrice } from '@/utils/formatters';

export function generateReceiptEscPos(sale: Sale, tenant?: Tenant): Uint8Array {
    const encoder = new EscPosEncoder();
    
    encoder.initialize();
    
    // Header
    encoder.align('center');
    if (tenant?.name) {
        encoder.bold(true).size(2, 2).line(tenant.name).size(1, 1).bold(false);
    } else {
        encoder.bold(true).size(2, 2).line('NexoPOS').size(1, 1).bold(false);
    }
    
    if (tenant?.rut) encoder.line(`RUT: ${tenant.rut}`);
    if (tenant?.address) encoder.line(tenant.address);
    if (tenant?.phone) encoder.line(`Tel: ${tenant.phone}`);
    encoder.newline();
    
    // Document Title
    encoder.bold(true);
    if (sale.dteType === 39) {
        encoder.line('BOLETA ELECTRONICA');
    } else if (sale.dteType === 33) {
        encoder.line('FACTURA ELECTRONICA');
    } else {
        encoder.line('COMPROBANTE DE VENTA');
    }
    encoder.bold(false);
    
    encoder.line(`Nro: ${sale.id}`);
    encoder.line(`Fecha: ${new Date(sale.createdAt).toLocaleString('es-CL')}`);
    encoder.newline();
    
    // Items
    encoder.align('left');
    encoder.line('Cant  Descripcion         Total');
    encoder.line('--------------------------------');
    
    sale.items?.forEach(item => {
        const qtyStr = item.quantity.toString().padEnd(5, ' ');
        // Truncate name to 16 chars
        const nameStr = (item.product?.name || 'Item').substring(0, 16).padEnd(16, ' ');
        const itemTotal = (item.price * item.quantity) - (item.discountAmount || 0);
        const totalStr = formatPrice(itemTotal).padStart(10, ' ');
        encoder.line(`${qtyStr}${nameStr} ${totalStr}`);
    });
    
    encoder.line('--------------------------------');
    
    // Totals
    encoder.align('right');
    encoder.size(2, 2).bold(true);
    encoder.line(`TOTAL: ${formatPrice(sale.total)}`);
    encoder.size(1, 1).bold(false);
    
    // Payment Method
    encoder.newline();
    encoder.align('left');
    
    if (sale.payments && sale.payments.length > 0) {
        sale.payments.forEach(p => {
            encoder.line(`Metodo: ${p.paymentMethod} - ${formatPrice(p.amount)}`);
        });
    } else {
        encoder.line(`Metodo de Pago: Efectivo`);
    }
    
    // Footer
    encoder.newline();
    encoder.align('center');
    encoder.line('¡Gracias por su compra!');
    encoder.line('Impulsado por NexoPOS');
    
    encoder.newline(4);
    encoder.cut();
    
    return encoder.encode();
}
