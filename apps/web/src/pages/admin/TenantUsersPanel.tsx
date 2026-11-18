import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ClientRecord, ClientUser, cardClass, errorMessage, fieldClass, primaryClass, roleLabels, secondaryClass } from './client-record';

export default function TenantUsersPanel({ tenant, onChanged }: { tenant: ClientRecord; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState<ClientUser | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ClientUser | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const toggle = async (user: ClientUser) => {
    if (!window.confirm((user.isActive ? '¿Deshabilitar a ' : '¿Habilitar a ') + (user.name || user.email) + ' en ' + tenant.name + '?')) return;
    setPending(user.id);
    try {
      await api.patch('/admin/tenants/' + tenant.id + '/users/' + user.id, { isActive: !user.isActive });
      await onChanged();
      toast.success(user.isActive ? 'Usuario deshabilitado; sus sesiones ya no permiten operar.' : 'Usuario habilitado.');
    } catch (error) { toast.error(errorMessage(error, 'No se pudo cambiar el estado del usuario.')); }
    finally { setPending(null); }
  };
  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleting) return;
    setPending(deleting.id);
    try {
      await api.delete('/admin/tenants/' + tenant.id + '/users/' + deleting.id, { data: { confirmation } });
      setDeleting(null); setConfirmation('');
      await onChanged(); toast.success('Usuario eliminado.');
    } catch (error) { toast.error(errorMessage(error, 'No se pudo eliminar el usuario.')); }
    finally { setPending(null); }
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold text-lg">Usuarios de la empresa</h2><p className="text-sm text-muted-foreground">Administra acceso, roles y sucursal de cada integrante.</p></div>
      <button className={primaryClass} onClick={() => setEditing('new')}><Plus size={16} /> Agregar usuario</button>
    </div>
    <div className="grid gap-3">
      {tenant.users.map(user => <div key={user.id} className={cardClass + ' flex flex-col gap-4 sm:flex-row sm:items-center'}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 font-bold">{(user.name || user.email).charAt(0).toUpperCase()}</div>
          <div className="min-w-0"><h3 className="font-semibold break-words">{user.name || 'Sin nombre'}</h3><p className="text-sm text-muted-foreground break-all">{user.email}</p><p className="mt-1 text-xs text-muted-foreground">{roleLabels[user.role] || user.role} · {tenant.branches.find(b => b.id === user.branchId)?.name || 'Sin sucursal asignada'}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + (user.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400')}>{user.isActive ? 'Habilitado' : 'Deshabilitado'}</span>
          {user.role === 'SUPER_ADMIN' ? <span className="text-xs text-muted-foreground">Cuenta protegida</span> : <>
            <button className={secondaryClass} disabled={!!pending} onClick={() => setEditing(user)}><Pencil size={14} /> Editar</button>
            <button className={secondaryClass} disabled={!!pending} onClick={() => toggle(user)}>{pending === user.id ? <Loader2 size={14} className="animate-spin" /> : null}{user.isActive ? 'Deshabilitar' : 'Habilitar'}</button>
            <button className={secondaryClass + ' text-red-400'} disabled={!!pending} aria-label={'Eliminar usuario ' + user.email} onClick={() => { setDeleting(user); setConfirmation(''); }}><Trash2 size={15} /></button>
          </>}
        </div>
      </div>)}
      {!tenant.users.length && <div className={cardClass + ' text-center text-muted-foreground'}><Users className="mx-auto mb-3" />No hay usuarios registrados.</div>}
    </div>
    <Dialog open={!!editing} onOpenChange={v => { if (!v) setEditing(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing === 'new' ? 'Agregar usuario' : 'Editar usuario'}</DialogTitle><DialogDescription>{tenant.name} · El rol y la sucursal se aplican también a las sesiones abiertas.</DialogDescription></DialogHeader>
        {editing && <UserForm key={editing === 'new' ? 'new' : editing.id} tenant={tenant} user={editing === 'new' ? null : editing} onSaved={async () => { setEditing(null); await onChanged(); }} />}
      </DialogContent>
    </Dialog>
    <Dialog open={!!deleting} onOpenChange={v => { if (!v && !pending) { setDeleting(null); setConfirmation(''); } }}>
      <DialogContent><DialogHeader><DialogTitle>Eliminar usuario</DialogTitle><DialogDescription>Se eliminará su acceso. Si tiene movimientos o ventas, deberás deshabilitarlo para conservar el historial.</DialogDescription></DialogHeader>
        <form onSubmit={remove} className="space-y-4"><label className="block text-sm">Escribe su correo para confirmar: <strong className="break-all">{deleting?.email}</strong><input className={fieldClass + ' mt-2'} value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" disabled={!!pending} /></label><button className={primaryClass + ' bg-red-600 hover:bg-red-500'} disabled={!!pending || confirmation !== deleting?.email}>Eliminar usuario</button></form>
      </DialogContent>
    </Dialog>
  </div>;
}
function UserForm({ tenant, user, onSaved }: { tenant: ClientRecord; user: ClientUser | null; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || 'MANAGER', branchId: user?.branchId || '', password: '' });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form, branchId: form.branchId || null, password: form.password || undefined };
      if (user) await api.patch('/admin/tenants/' + tenant.id + '/users/' + user.id, data);
      else await api.post('/admin/tenants/' + tenant.id + '/users', data);
      setForm(prev => ({ ...prev, password: '' }));
      await onSaved(); toast.success(user ? 'Usuario actualizado.' : 'Usuario creado.');
    } catch (error) { toast.error(errorMessage(error, 'No se pudo guardar el usuario.')); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="space-y-4">
    <label className="block text-sm">Nombre<input className={fieldClass + ' mt-1'} maxLength={150} value={form.name} disabled={saving} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
    <label className="block text-sm">Correo<input className={fieldClass + ' mt-1'} type="email" required maxLength={254} value={form.email} disabled={saving} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Rol<select className={fieldClass + ' mt-1'} value={form.role} disabled={saving} onChange={e => setForm({ ...form, role: e.target.value })}>{['TENANT_ADMIN', 'MANAGER', 'CASHIER'].map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
    <label className="text-sm">Sucursal<select className={fieldClass + ' mt-1'} value={form.branchId} disabled={saving} onChange={e => setForm({ ...form, branchId: e.target.value })}><option value="">Sin sucursal</option>{tenant.branches.map(b => <option key={b.id} value={b.id} disabled={!b.isActive && b.id !== user?.branchId}>{b.name}{b.isActive ? '' : ' (deshabilitada)'}</option>)}</select></label></div>
    <label className="block text-sm">{user ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}<input className={fieldClass + ' mt-1'} type="password" autoComplete="new-password" required={!user} minLength={8} maxLength={72} disabled={saving} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
    <p className="text-xs text-muted-foreground">Al cambiar la contraseña se invalidan las sesiones anteriores. La contraseña no se envía por correo.</p>
    <button className={primaryClass + ' w-full'} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Guardando...' : 'Guardar usuario'}</button>
  </form>;
}
