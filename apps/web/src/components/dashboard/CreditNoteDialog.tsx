import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { emitNotaCredito, getCreditNotePreview, verifySaleDte } from '../../api/sales';
import { formatCLP, formatSaleDate } from '../../services/sales.service';

const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50';
const states: Record<string, string> = { PENDING: 'Pendiente de envío', BLOQUEADO: 'Emisión bloqueada', ERROR: 'Envío con error', ENVIANDO: 'Envío en curso', PENDIENTE_CONFIRMACION: 'Resultado sin confirmar', EMITIDO: 'Emitida; falta estado SII', PENDIENTE_SII: 'Pendiente SII', REPARO: 'Con reparo', RECHAZADO: 'Rechazada por el SII', REQUIERE_REVISION: 'Requiere revisión', ACEPTADO: 'Aceptada por el SII' };
const errorMessage = (error: any) => error.response?.data?.message || 'No se pudo confirmar el resultado. Actualiza el estado antes de intentar otra emisión.';
export function CreditNoteDialog({ saleId, onClose, onChanged }: { saleId: string; onClose: () => void; onChanged: () => Promise<unknown> }) {
    const client = useQueryClient();
    const [acknowledged, setAcknowledged] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const [failure, setFailure] = useState('');
    const query = useQuery({ queryKey: ['credit-note-preview', saleId], queryFn: ({ signal }) => getCreditNotePreview(saleId, signal), staleTime: 0, refetchOnMount: 'always', retry: 1 });
    const data = query.data;
    const refresh = async () => {
        await Promise.all([query.refetch(), onChanged(), client.invalidateQueries({ queryKey: ['dte-stats'] }), client.invalidateQueries({ queryKey: ['admin-dte-records'] })]);
    };
    const emission = useMutation({
        mutationFn: () => emitNotaCredito(saleId),
        onSuccess: async result => {
            setAcknowledged(false);
            if (result.success) toast.success(result.status === 'ACEPTADO' ? 'Nota de crédito aceptada. Venta anulada e inventario repuesto.' : 'Nota emitida; falta confirmación del SII. La venta sigue activa.');
            else { setFailure(result.error || 'La nota requiere revisión. Consulta su estado antes de volver a emitir.'); toast.error('La nota de crédito requiere revisión.'); }
            await refresh();
        },
        onError: async error => { setAcknowledged(false); setUncertain(true); setFailure(errorMessage(error)); await refresh(); },
    });
    const verification = useMutation({
        mutationFn: () => verifySaleDte(data!.existingNote!.id),
        onSuccess: async result => { setFailure(result.error || ''); toast.success(result.status === 'ACEPTADO' ? 'Aceptación confirmada. Venta anulada e inventario repuesto.' : 'Estado actualizado: ' + (states[result.status] || result.status)); await refresh(); },
        onError: error => setFailure(errorMessage(error)),
    });
    const busy = emission.isPending || verification.isPending;
    return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-xl" onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>Nota de crédito</DialogTitle><DialogDescription>Revisa el documento y las condiciones antes de solicitar una anulación total.</DialogDescription></DialogHeader>
        {query.isFetching && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Validando documento, servicio y folios...</p>}
        {query.isError ? <div role="alert" className="space-y-3 text-sm"><p>{errorMessage(query.error)}</p><button className={button} onClick={() => query.refetch()}>Reintentar validación</button></div> : data && <>
            <dl className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Documento original</dt><dd className="mt-1 font-semibold">{data.sale.type === 33 ? 'Factura' : data.sale.type === 39 ? 'Boleta' : 'Documento'} {data.sale.folio ? '· Folio ' + data.sale.folio : '· Sin folio confirmado'}</dd></div><div><dt className="text-muted-foreground">Total a anular</dt><dd className="mt-1 text-lg font-bold">{formatCLP(data.sale.total)}</dd></div><div><dt className="text-muted-foreground">Fecha de la venta</dt><dd className="mt-1">{formatSaleDate(data.sale.createdAt)}</dd></div><div><dt className="text-muted-foreground">Sucursal</dt><dd className="mt-1 break-words">{data.sale.branchName || 'Sin información'}</dd></div></dl>
            <p role={!data.canEmit ? 'status' : undefined} className={'flex items-start gap-2 rounded-xl p-3 text-sm ' + (data.canEmit ? 'bg-cyan-500/10 text-cyan-500' : 'bg-amber-500/10 text-amber-500')}>{data.canEmit ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}<span>{data.message}</span></p>
            {data.existingNote && <div className="rounded-xl border border-border p-4 text-sm"><h3 className="font-semibold">Nota de crédito asociada</h3><p className="mt-2">{data.existingNote.folio ? 'Folio ' + data.existingNote.folio + ' · ' : ''}{data.existingNote.status === 'CREDIT_NOTE' ? 'Aceptada y aplicada' : states[data.existingNote.dteStatus] || data.existingNote.dteStatus}</p>{data.existingNote.canVerify && <button className={button + ' mt-3'} disabled={busy || query.isFetching} onClick={() => verification.mutate()}><RefreshCw size={16} className={verification.isPending ? 'animate-spin' : ''} />Consultar estado en Lioren</button>}</div>}
            {data.canEmit && <><p className="text-sm text-muted-foreground">Esta acción anula el documento completo. La venta se marcará anulada y el inventario se repondrá una sola vez, cuando el SII acepte la nota. La devolución del dinero al cliente se gestiona por separado.</p><label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" className="mt-1" checked={acknowledged} disabled={busy || uncertain || query.isFetching} onChange={event => setAcknowledged(event.target.checked)} /><span>Confirmo la anulación total de este documento por {formatCLP(data.sale.total)}.</span></label></>}
        </>}
        {failure && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{failure}</p>}
        <div className="flex flex-wrap justify-end gap-2"><button className={button} disabled={busy} onClick={onClose}>Cerrar</button><button className={button} disabled={busy || query.isFetching} onClick={() => { setAcknowledged(false); query.refetch(); }}><RefreshCw size={16} />Actualizar validación</button>{data?.canEmit && !query.isError && <button className={button + ' border-amber-500/30 bg-amber-500/10 text-amber-500'} disabled={!acknowledged || busy || uncertain || query.isFetching} onClick={() => emission.mutate()}>{emission.isPending && <Loader2 size={16} className="animate-spin" />}Emitir nota de crédito</button>}</div>
    </DialogContent></Dialog>;
}
