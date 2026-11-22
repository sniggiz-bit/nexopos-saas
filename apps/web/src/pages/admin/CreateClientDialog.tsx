import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { errorMessage, fieldClass, primaryClass, secondaryClass } from './client-record';

export default function CreateClientDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', userName: '', email: '', phone: '', password: '', rut: '', giro: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (![form.companyName, form.userName, form.phone].every(value => value.trim())) {
      setError('Completa el nombre de la empresa, el administrador y el teléfono.');
      return;
    }
    if (new TextEncoder().encode(form.password).length > 72) {
      setError('La contraseña excede 72 bytes. Usa menos caracteres.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<{ tenant: { id: string } }>('/admin/tenants', {
        ...form,
        companyName: form.companyName.trim(), userName: form.userName.trim(),
        email: form.email.trim().toLowerCase(), phone: form.phone.trim(),
        rut: form.rut.trim() || undefined, giro: form.giro.trim() || undefined, address: form.address.trim() || undefined,
      });
      setForm(prev => ({ ...prev, password: '' }));
      toast.success('Cliente y administrador creados.');
      onClose();
      navigate('/admin/tenants/' + encodeURIComponent(data.tenant.id));
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear el cliente. Revisa los datos e intenta nuevamente.'));
    } finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogDescription>Crea la empresa y su cuenta de administrador. Se habilitará una Casa Matriz; podrás asignar el plan y los servicios desde su ficha.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-5" aria-busy={saving}>
        <fieldset disabled={saving} className="space-y-4">
          <legend className="mb-3 text-base font-semibold">Datos de la empresa</legend>
          <label className="block text-sm">Nombre de la empresa<input className={fieldClass + ' mt-1'} required maxLength={150} autoComplete="organization" value={form.companyName} onChange={e => update('companyName', e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">Teléfono<input className={fieldClass + ' mt-1'} type="tel" required maxLength={30} autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
            <label className="block text-sm">RUT (opcional)<input className={fieldClass + ' mt-1'} maxLength={30} placeholder="12.345.678-5" value={form.rut} onChange={e => update('rut', e.target.value)} /></label>
          </div>
          <label className="block text-sm">Giro comercial (opcional)<input className={fieldClass + ' mt-1'} maxLength={150} value={form.giro} onChange={e => update('giro', e.target.value)} /></label>
          <label className="block text-sm">Dirección (opcional)<input className={fieldClass + ' mt-1'} maxLength={300} autoComplete="street-address" value={form.address} onChange={e => update('address', e.target.value)} /></label>
        </fieldset>
        <fieldset disabled={saving} className="space-y-4 border-t border-border pt-4">
          <legend className="px-1 text-base font-semibold">Usuario administrador</legend>
          <label className="block text-sm">Nombre del administrador<input className={fieldClass + ' mt-1'} required maxLength={150} autoComplete="name" value={form.userName} onChange={e => update('userName', e.target.value)} /></label>
          <label className="block text-sm">Correo del administrador<input className={fieldClass + ' mt-1'} type="email" required maxLength={254} autoComplete="off" value={form.email} onChange={e => update('email', e.target.value)} /></label>
          <div>
            <label htmlFor="client-initial-password" className="block text-sm">Contraseña inicial</label>
            <div className="relative mt-1">
              <input id="client-initial-password" className={fieldClass + ' pr-12'} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="client-password-help" value={form.password} onChange={e => update('password', e.target.value)} />
              <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <p id="client-password-help" className="mt-2 text-sm text-muted-foreground">Mínimo 8 caracteres. Comparte esta contraseña con el administrador; el correo de bienvenida no la incluye.</p>
          </div>
        </fieldset>
        {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <button type="button" className={secondaryClass} disabled={saving} onClick={onClose}>Cancelar</button>
          <button type="submit" className={primaryClass} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Creando cliente...' : 'Crear cliente'}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
