import { useState } from 'react';
import { Ban, CheckCircle2, Loader2, LogIn, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ClientRecord, cardClass, errorMessage, fieldClass, primaryClass, secondaryClass } from './client-record';

interface Preview { name: string; confirmation: string; protectedAccount: boolean; counts: Record<string, number> }
export default function TenantActionsPanel({ tenant, onChanged, onDeleted }: { tenant: ClientRecord; onChanged: () => Promise<void>; onDeleted: () => void }) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const owner = tenant.users.find(u => u.role === 'TENANT_ADMIN' && u.isActive);
  const toggle = async () => {
    const status = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm((status === 'SUSPENDED' ? '¿Suspender el acceso de toda la empresa ' : '¿Reactivar la empresa ') + tenant.name + '?')) return;
    setPending(true);
    try {
      await api.patch('/admin/tenants/' + tenant.id + '/status', { status });
      await onChanged(); toast.success(status === 'ACTIVE' ? 'Empresa reactivada.' : 'Empresa suspendida.');
    } catch (error) { toast.error(errorMessage(error, 'No se pudo cambiar el estado.')); }
    finally { setPending(false); }
  };
  const impersonate = async () => {
    if (!owner || !window.confirm('¿Acceder al panel como ' + (owner.name || owner.email) + ' de ' + tenant.name + '?')) return;
    setPending(true);
    try {
      const { data } = await api.post('/auth/impersonate/' + owner.id);
      localStorage.setItem('__prev_session_token', localStorage.getItem('token') || '');
      localStorage.setItem('__prev_session_user', localStorage.getItem('user') || '');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('impersonating', tenant.name);
      window.location.href = '/dashboard';
    } catch (error) { toast.error(errorMessage(error, 'No se pudo abrir el panel del cliente.')); setPending(false); }
  };
  const showDelete = async () => {
    setOpen(true); setPreview(null); setPreviewError(''); setConfirmation(''); setPassword(''); setAcknowledged(false);
    try { const res = await api.get('/admin/tenants/' + tenant.id + '/deletion-preview'); setPreview(res.data); }
    catch (error) { setPreviewError(errorMessage(error, 'No se pudo preparar el resumen de eliminación.')); }
  };
  const close = () => { if (!pending) { setOpen(false); setPassword(''); setConfirmation(''); setPreview(null); } };
  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || preview.protectedAccount || confirmation !== preview.confirmation || !password || !acknowledged) return;
    setPending(true);
    try {
      const res = await api.delete('/admin/tenants/' + tenant.id, { data: { confirmation, password }, timeout: 90000 });
      setPassword('');
      if (res.data.cleanup?.pending) toast('Cuenta eliminada. Quedan archivos pendientes de limpieza; revisa el registro de administración.', { icon: '⚠️' });
      else toast.success('Cuenta eliminada completamente del sistema.');
      onDeleted();
    } catch (error: any) {
      setPassword('');
      if (!error.response) {
        try { await api.get('/admin/tenants/' + tenant.id); }
        catch (check: any) { if (check.response?.status === 404) { toast.success('La cuenta se eliminó.'); onDeleted(); return; } }
      }
      toast.error(errorMessage(error, 'No se confirmó la eliminación. Actualiza la ficha antes de intentar nuevamente.'));
    } finally { setPending(false); }
  };
  const labels: Record<string, string> = { users: 'Usuarios', branches: 'Sucursales', products: 'Productos', sales: 'Ventas', purchases: 'Compras', customers: 'Clientes del negocio', suppliers: 'Proveedores', quotes: 'Cotizaciones', credits: 'Créditos', invoices: 'Facturas de servicios', ecommerceConnections: 'Integraciones' };
  return <div className="space-y-5">
    <section className={cardClass}><div className="flex gap-3"><LogIn className="shrink-0 text-cyan-500" size={22} /><div><h2 className="font-semibold">Acceder como cliente</h2><p className="mt-1 text-sm text-muted-foreground">Abre el panel del administrador para asistirlo con su configuración.</p></div></div><button className={secondaryClass + ' mt-4'} disabled={pending || !owner || tenant.status !== 'ACTIVE'} onClick={impersonate}>Abrir panel del cliente</button></section>
    <section className={cardClass}><div className="flex gap-3"><Ban className="shrink-0 text-amber-500" size={22} /><div><h2 className="font-semibold">{tenant.status === 'ACTIVE' ? 'Suspender empresa' : 'Reactivar empresa'}</h2><p className="mt-1 text-sm text-muted-foreground">Controla el acceso de todos sus usuarios conservando sus datos e historial.</p></div></div><button className={secondaryClass + ' mt-4'} disabled={pending || tenant.protectedAccount} onClick={toggle}>{pending ? <Loader2 size={15} className="animate-spin" /> : tenant.status === 'ACTIVE' ? <Ban size={15} /> : <CheckCircle2 size={15} />}{tenant.status === 'ACTIVE' ? 'Suspender acceso' : 'Reactivar acceso'}</button>{tenant.protectedAccount && <p className="mt-3 text-xs text-muted-foreground">Esta cuenta contiene administradores de la plataforma y está protegida.</p>}</section>
    <section className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5 sm:p-6"><div className="flex gap-3"><ShieldAlert className="shrink-0 text-red-400" size={22} /><div><h2 className="font-semibold text-red-400">Eliminar cuenta completa</h2><p className="mt-1 text-sm text-muted-foreground">Elimina la empresa, sus usuarios, sucursales, catálogo y registros operativos. Esta acción es permanente.</p></div></div><button className={secondaryClass + ' mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10'} disabled={pending || tenant.protectedAccount} onClick={showDelete}><Trash2 size={15} />Revisar eliminación</button></section>
    <Dialog open={open} onOpenChange={v => { if (!v) close(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Eliminar cuenta de {tenant.name}</DialogTitle><DialogDescription>Revisa el alcance antes de confirmar. La eliminación afecta únicamente a esta empresa.</DialogDescription></DialogHeader>
        {previewError ? <p role="alert" className="text-red-400">{previewError}</p> : !preview ? <p className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} />Preparando resumen...</p> : <form onSubmit={remove} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3">{Object.entries(preview.counts).map(([key, count]) => <div key={key} className="flex justify-between gap-2 text-sm"><span className="text-muted-foreground">{labels[key] || key}</span><strong>{count}</strong></div>)}</div>
          <p className="text-xs text-muted-foreground">Se retirarán los archivos vinculados que no utilice otro cliente y las conversaciones internas. Las copias de respaldo, correos ya enviados y datos de plataformas externas se conservan.</p>
          <label className="block text-sm">Escribe <strong className="break-all">{preview.confirmation}</strong><input className={fieldClass + ' mt-2'} autoComplete="off" required disabled={pending} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
          <label className="block text-sm">Tu contraseña de superadmin<input className={fieldClass + ' mt-1'} type="password" autoComplete="current-password" required disabled={pending} value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" required disabled={pending} checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /><span>Comprendo que se eliminarán los datos de esta empresa de forma permanente.</span></label>
          <div className="flex flex-wrap justify-end gap-2"><button className={secondaryClass} type="button" disabled={pending} onClick={close}>Cancelar</button><button className={primaryClass + ' bg-red-600 hover:bg-red-500'} disabled={pending || !acknowledged || !password || confirmation !== preview.confirmation || preview.protectedAccount}>{pending && <Loader2 size={16} className="animate-spin" />}{pending ? 'Eliminando cuenta...' : 'Eliminar cuenta permanentemente'}</button></div>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
