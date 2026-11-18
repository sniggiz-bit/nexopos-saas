import { useState } from 'react';
import { Home, Loader2, MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ClientBranch, ClientRecord, cardClass, errorMessage, fieldClass, primaryClass, secondaryClass } from './client-record';

export default function TenantBranchesPanel({ tenant, onChanged }: { tenant: ClientRecord; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState<ClientBranch | 'new' | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const change = async (branch: ClientBranch, deleting = false) => {
    const action = deleting ? 'eliminar' : branch.isActive ? 'deshabilitar' : 'habilitar';
    if (!window.confirm('¿Confirmas ' + action + ' la sucursal "' + branch.name + '" de ' + tenant.name + '?')) return;
    setPending(branch.id);
    try {
      const url = '/admin/tenants/' + tenant.id + '/branches/' + branch.id;
      if (deleting) await api.delete(url);
      else await api.patch(url, { isActive: !branch.isActive });
      await onChanged(); toast.success('Sucursal ' + (deleting ? 'eliminada.' : branch.isActive ? 'deshabilitada.' : 'habilitada.'));
    } catch (error) { toast.error(errorMessage(error, 'No se pudo actualizar la sucursal.')); }
    finally { setPending(null); }
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-lg">Sucursales del cliente</h2><p className="text-sm text-muted-foreground">{tenant.branches.filter(b => b.isActive).length} habilitadas · Límite: {tenant.settings?.maxBranches ?? 1}</p></div><button className={primaryClass} onClick={() => setEditing('new')}><Plus size={16} /> Crear sucursal</button></div>
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-muted-foreground">Solo el superadmin crea, edita y habilita sucursales. Al deshabilitar una, se bloquean nuevas operaciones y se conserva su historial.</div>
    <div className="grid gap-4 md:grid-cols-2">{tenant.branches.map(branch => <div key={branch.id} className={cardClass + ' space-y-4'}>
      <div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500"><Store size={22} /></div><div className="flex flex-wrap justify-end gap-2">{branch.isMain && <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-500"><Home size={12} />Matriz</span>}<span className={'rounded-full px-2 py-1 text-xs font-semibold ' + (branch.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400')}>{branch.isActive ? 'Habilitada' : 'Deshabilitada'}</span></div></div>
      <div><h3 className="font-semibold text-lg break-words">{branch.name}</h3><p className="mt-1 flex gap-2 text-sm text-muted-foreground"><MapPin size={15} className="mt-0.5 shrink-0" />{branch.address || 'Sin dirección registrada'}</p></div>
      <p className="text-xs text-muted-foreground">{branch._count?.users ?? 0} usuarios asignados · {branch._count?.sales ?? 0} ventas registradas</p>
      <div className="flex flex-wrap gap-2 border-t border-border pt-4"><button className={secondaryClass} disabled={!!pending} onClick={() => setEditing(branch)}><Pencil size={14} />Editar</button><button className={secondaryClass} disabled={!!pending} onClick={() => change(branch)}>{pending === branch.id && <Loader2 size={14} className="animate-spin" />}{branch.isActive ? 'Deshabilitar' : 'Habilitar'}</button><button className={secondaryClass + ' text-red-400'} aria-label={'Eliminar sucursal ' + branch.name} disabled={!!pending || branch.isMain} title={branch.isMain ? 'Asigna otra sucursal como matriz para eliminar esta.' : 'Solo se eliminan sucursales sin usuarios, existencias ni historial.'} onClick={() => change(branch, true)}><Trash2 size={15} /></button></div>
    </div>)}</div>
    {!tenant.branches.length && <div className={cardClass + ' text-muted-foreground'}>No hay sucursales. Crea una y decide cuándo habilitarla.</div>}
    <Dialog open={!!editing} onOpenChange={v => { if (!v) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>{editing === 'new' ? 'Crear sucursal' : 'Editar sucursal'}</DialogTitle><DialogDescription>{tenant.name}</DialogDescription></DialogHeader>{editing && <BranchForm key={editing === 'new' ? 'new' : editing.id} tenant={tenant} branch={editing === 'new' ? null : editing} onSaved={async () => { setEditing(null); await onChanged(); }} />}</DialogContent></Dialog>
  </div>;
}
function BranchForm({ tenant, branch, onSaved }: { tenant: ClientRecord; branch: ClientBranch | null; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ name: branch?.name || '', address: branch?.address || '', isMain: branch?.isMain || false, isActive: branch?.isActive || false });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form, isMain: branch?.isMain ? undefined : form.isMain };
      const url = '/admin/tenants/' + tenant.id + '/branches';
      if (branch) await api.patch(url + '/' + branch.id, data); else await api.post(url, data);
      await onSaved(); toast.success('Sucursal guardada.');
    } catch (error) { toast.error(errorMessage(error, 'No se pudo guardar la sucursal.')); }
    finally { setSaving(false); }
  };
  return <form className="space-y-4" onSubmit={save}>
    <label className="block text-sm">Nombre<input className={fieldClass + ' mt-1'} required maxLength={120} disabled={saving} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
    <label className="block text-sm">Dirección<input className={fieldClass + ' mt-1'} maxLength={300} disabled={saving} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isMain} disabled={saving || branch?.isMain} onChange={e => setForm({ ...form, isMain: e.target.checked })} />Usar como sucursal principal</label>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} disabled={saving} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Habilitada para operar</label>
    <p className="text-xs text-muted-foreground">Para habilitarla debe haber cupo en el límite de sucursales. Deshabilitarla bloquea nuevas operaciones y permite cerrar las cajas que ya estuvieran abiertas.</p>
    <button className={primaryClass + ' w-full'} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Guardando...' : 'Guardar sucursal'}</button>
  </form>;
}
