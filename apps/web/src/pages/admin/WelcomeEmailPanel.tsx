import { useCallback, useEffect, useState } from 'react';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

type Attempt = { status: 'PENDING' | 'ACCEPTED' | 'FAILED' | 'NOT_CONFIGURED'; attemptedAt: string; providerId?: string; error?: string };
type WelcomeStatus = { configured: boolean; reason: string | null; users: { id: string; name: string | null; email: string; attempt: Attempt | null }[] };
const labels = { PENDING: 'Sin confirmación del resultado', ACCEPTED: 'Aceptado por Resend', FAILED: 'Envío fallido o sin confirmar', NOT_CONFIGURED: 'Configuración incompleta' };

export default function WelcomeEmailPanel({ tenantId, active }: { tenantId: string; active: boolean }) {
    const [data, setData] = useState<WelcomeStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [sending, setSending] = useState<string | null>(null);
    const load = useCallback(async () => {
        setLoading(true);
        setFailed(false);
        try { const response = await api.get<WelcomeStatus>(`/admin/tenants/${tenantId}/welcome-email`); setData(response.data); }
        catch { setFailed(true); }
        finally { setLoading(false); }
    }, [tenantId]);
    useEffect(() => { void load(); }, [load]);

    const send = async (userId: string) => {
        setSending(userId);
        try {
            const response = await api.post<Pick<Attempt, 'status' | 'error'>>(`/admin/tenants/${tenantId}/users/${userId}/welcome-email`);
            if (response.data.status === 'ACCEPTED') toast.success('Bienvenida aceptada por Resend');
            else toast.error(response.data.error || 'No se pudo confirmar el envío');
            await load();
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            toast.error(message || 'No se pudo enviar la bienvenida');
        } finally { setSending(null); }
    };

    return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Mail size={16} />Correo de bienvenida</h3>
                <button type="button" onClick={() => void load()} disabled={loading || !!sending} aria-label="Actualizar estado de bienvenida" className="text-neutral-400 hover:text-white disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
            </div>
            <p className="text-xs text-neutral-400">Envía los primeros pasos y el enlace de acceso. El reenvío conserva la contraseña actual.</p>
            {loading ? <p className="text-xs text-neutral-400">Cargando estado...</p> : failed ? <p role="alert" className="text-xs text-red-300">No se pudo consultar el estado. Usa el botón actualizar para reintentar.</p> : data && <>
                {!data.configured && <p role="alert" className="text-xs text-amber-300">{data.reason}</p>}
                {!active && <p className="text-xs text-amber-300">La empresa debe estar activa para enviar la bienvenida.</p>}
                {data.users.length === 0 && <p className="text-xs text-neutral-400">Esta empresa no tiene un administrador asignado.</p>}
                {data.users.map(user => <div key={user.id} className="rounded-lg bg-neutral-900/50 p-3 space-y-2">
                    <p className="text-sm text-neutral-200 break-all">{user.name || user.email}</p>
                    <p className="text-xs text-neutral-400 break-all">{user.email}</p>
                    <p className={`text-xs ${user.attempt?.status === 'ACCEPTED' ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {user.attempt ? labels[user.attempt.status] : 'Sin registro de envío'}
                    </p>
                    {user.attempt && <>
                        <p className="text-xs text-neutral-500">Último intento: {new Date(user.attempt.attemptedAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</p>
                        {user.attempt.error && <p className="text-xs text-red-300">{user.attempt.error}</p>}
                        {user.attempt.providerId && <p className="text-xs text-neutral-500 break-all">Referencia: {user.attempt.providerId}</p>}
                    </>}
                    <button type="button" onClick={() => void send(user.id)} disabled={!!sending || !data.configured || !active} className="flex items-center justify-center gap-2 w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white">
                        {sending === user.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                        {sending === user.id ? 'Enviando...' : user.attempt ? 'Reenviar bienvenida' : 'Enviar bienvenida'}
                    </button>
                </div>)}
                <p className="text-xs text-neutral-500">El estado registra la respuesta al envío. La entrega y los rebotes se consultan en Resend. Los envíos anteriores a esta mejora pueden no tener registro.</p>
            </>}
        </div>
    );
}
