import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethod } from '@/api/sales';
import { formatPrice } from '@/utils/formatters';

type OfflinePayment = typeof PaymentMethod.CASH | typeof PaymentMethod.DEBIT | typeof PaymentMethod.TRANSFER;

export interface OfflineCheckoutSettings {
    active: boolean;
    ready: boolean;
    fiscal: boolean;
    total: number;
    onSave: (method: OfflinePayment, receipt: string, payment: string) => Promise<void>;
}

interface Props {
    settings: OfflineCheckoutSettings;
    includesPresale: boolean;
    onClose: () => void;
}

export function OfflineCheckout({ settings, includesPresale, onClose }: Props) {
    const { total } = settings;
    const [method, setMethod] = useState<OfflinePayment>(PaymentMethod.CASH);
    const [received, setReceived] = useState(String(Math.ceil(total)));
    const [receipt, setReceipt] = useState('');
    const [payment, setPayment] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submitting = useRef(false);
    const cash = method === PaymentMethod.CASH;
    const canSave = settings.ready && !includesPresale && total > 0 && (cash ? Number(received) >= total : !!payment.trim()) &&
        (!settings.fiscal || !!receipt.trim());

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canSave || submitting.current) return;
        submitting.current = true;
        setSaving(true);
        setError('');
        try {
            await settings.onSave(method, receipt.trim(), cash ? '' : payment.trim());
            onClose();
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : 'No se pudo guardar la venta.');
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    }

    return (
        <form className="flex h-full flex-col overflow-y-auto p-4 gap-4" onSubmit={submit}>
            <div>
                <h2 className="text-lg font-bold">Cobro sin conexión</h2>
                <p className="text-sm text-muted-foreground">La venta quedar? en este equipo hasta que se sincronice.</p>
            </div>
            <p className="text-2xl font-black">{formatPrice(total)}</p>
            {!settings.ready || includesPresale ? (
                <p className="text-sm" role="status">{includesPresale
                    ? 'Necesitas conexión para cobrar una preventa.'
                    : 'Conéctate para cargar el catálogo y confirmar un turno abierto antes de vender.'}</p>
            ) : (
                <>
                    <label className="grid gap-1 text-sm">
                        Pago recibido
                        <select className="rounded-md border p-2 bg-background" value={method}
                            onChange={event => setMethod(event.target.value as OfflinePayment)} disabled={saving}>
                            <option value={PaymentMethod.CASH}>Efectivo</option>
                            <option value={PaymentMethod.DEBIT}>Débito autorizado en otro terminal</option>
                            <option value={PaymentMethod.TRANSFER}>Transferencia confirmada</option>
                        </select>
                    </label>
                    {cash ? (
                        <label className="grid gap-1 text-sm">
                            Efectivo recibido
                            <Input type="number" inputMode="numeric" min={Math.ceil(total)} step={1}
                                value={received} onChange={event => setReceived(event.target.value)} disabled={saving} required />
                            <span className="text-muted-foreground">Vuelto {formatPrice(Math.max(0, Number(received) - total))}</span>
                        </label>
                    ) : (
                        <label className="grid gap-1 text-sm">
                            Número de operación del pago ya confirmado
                            <Input value={payment} onChange={event => setPayment(event.target.value)} maxLength={80} disabled={saving} required />
                        </label>
                    )}
                    {settings.fiscal && (
                        <label className="grid gap-1 text-sm">
                            Referencia del documento tributario de contingencia
                            <Input value={receipt} onChange={event => setReceipt(event.target.value)} maxLength={80} disabled={saving} required />
                            <span className="text-muted-foreground">Ingresa el tipo y folio del documento ya entregado al cliente.</span>
                        </label>
                    )}
                </>
            )}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="mt-auto flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Volver</Button>
                <Button type="submit" disabled={!canSave || saving}>{saving ? 'Guardando…' : 'Guardar venta'}</Button>
            </div>
        </form>
    );
}
