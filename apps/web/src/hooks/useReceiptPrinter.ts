import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { Sale } from '@/api/sales';
import type { Tenant } from '@nexopos/shared';
import type { PrintFormat } from './usePrintSettings';
import { printSaleAction, printSaleErrorMessage } from '@/components/pos/receipts/ReceiptRenderer';
export function useReceiptPrinter(format: PrintFormat, tenant: Tenant | null | undefined, direct: boolean, printBytes: (bytes: Uint8Array) => Promise<boolean>, columns80: 42 | 48, cutPaper: boolean) {
    const jobId = useRef(0);
    const [status, setStatus] = useState<'idle' | 'printing' | 'sent' | 'failed'>('idle');
    const print = useCallback(async (sale: Sale) => {
        const job = ++jobId.current;
        setStatus('printing');
        try { await printSaleAction(sale, format, tenant, direct, printBytes, { columns80, cutPaper }); if (job === jobId.current) setStatus('sent'); return true; }
        catch (error) { if (job === jobId.current) setStatus('failed'); toast.error(printSaleErrorMessage(error)); return false; }
    }, [format, tenant, direct, printBytes, columns80, cutPaper]);
    const reset = useCallback(() => { jobId.current++; setStatus('idle'); }, []);
    const description = status === 'printing' ? direct && format !== 'A4' ? 'Enviando a la impresora...' : 'Preparando comprobante...'
        : status === 'failed' ? 'Venta guardada. Impresión pendiente.' : status === 'sent' ? direct && format !== 'A4' ? 'Enviado a la impresora' : 'Comprobante preparado' : 'Procesada correctamente';
    return { status, print, reset, description };
}
