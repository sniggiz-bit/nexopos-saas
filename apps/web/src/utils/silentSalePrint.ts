import type { Sale } from '@/api/sales';
import type { Tenant } from '@nexopos/shared';
import type { ThermalFormat, ThermalOptions } from './thermalLayout';
import { generateReceiptEscPos } from '@/components/pos/receipts/ReceiptToEscPos';
export class SilentPrintError extends Error {}
const unavailable = () => new SilentPrintError('Venta guardada. La impresora directa no está conectada. Vincúlala y pulsa Reimprimir; no se abrirá un diálogo.');
export interface SilentTransport { isReady(): boolean; write(bytes: Uint8Array): Promise<boolean> }
export async function sendSaleToPrinter(sale: Sale, format: ThermalFormat, tenant: Tenant | null | undefined, options: ThermalOptions,
    transport: SilentTransport, loadBoleta: (saleId: string, format: ThermalFormat, options: ThermalOptions) => Promise<Uint8Array>): Promise<void> {
    if (!transport.isReady()) throw unavailable();
    let bytes: Uint8Array;
    if (sale.dteType === 0 || sale.dteStatus === 'INTERNO') bytes = generateReceiptEscPos(sale, tenant || undefined, format, options);
    else {
        if (sale.dteType !== 39) throw new SilentPrintError('Venta guardada. La impresión directa admite comprobantes internos y boletas electrónicas.');
        if (!sale.dteVerifiedAt || !sale.dteProviderId || !sale.dteFolio) throw new SilentPrintError('Venta guardada. La boleta aún no está confirmada para imprimir su timbre. Revisa su estado antes de reimprimir.');
        try { bytes = await loadBoleta(sale.id, format, options); }
        catch { throw new SilentPrintError('Venta guardada. No se pudo preparar la boleta con su timbre. Reintenta la reimpresión desde esta venta.'); }
    }
    if (!transport.isReady() || !await transport.write(bytes)) throw unavailable();
}
