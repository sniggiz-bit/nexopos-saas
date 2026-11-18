import { useCallback, useEffect, useState } from 'react';
import { Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { cardClass, errorMessage, primaryClass, secondaryClass } from './client-record';
interface Module { id: string; code: string; name: string; description: string | null; isActive: boolean }
interface Access {
  catalog: Module[]; allActive: Module[]; planModules: Module[];
  inheritedCodes: string[]; overrides: Array<{ moduleId: string; enabled: boolean }>;
}
export default function TenantServicesPanel({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<Access | null>(null);
  const [choices, setChoices] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/modules/tenant/' + tenantId);
      setData(res.data);
      setChoices(Object.fromEntries(res.data.overrides.map((o: any) => [o.moduleId, o.enabled])));
    } catch (err) { setError(errorMessage(err, 'No se pudieron cargar los servicios.')); }
    finally { setLoading(false); }
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/tenants/' + tenantId + '/modules', { overrides: Object.entries(choices).map(([moduleId, enabled]) => ({ moduleId, enabled })) });
      await load(); toast.success('Servicios actualizados para este cliente.');
    } catch (err) { toast.error(errorMessage(err, 'No se pudieron guardar los servicios.')); }
    finally { setSaving(false); }
  };
  if (loading && !data) return <p className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="animate-spin" size={18} />Cargando servicios...</p>;
  if (error) return <div className={cardClass}><p role="alert" className="text-red-400 mb-3">{error}</p><button className={secondaryClass} onClick={load}>Reintentar</button></div>;
  const inherited = new Set(data?.inheritedCodes || []);
  const planIds = new Set(data?.planModules.map(m => m.id) || []);
  const groups = [
    { name: 'Operación del negocio', codes: ['POS', 'QUOTES', 'CUSTOMERS', 'CREDITS'] },
    { name: 'Tienda e integraciones', codes: ['ECOMMERCE', 'TRANSBANK', 'SHOPIFY', 'WOOCOMMERCE'] },
    { name: 'Documentos tributarios electrónicos', codes: ['DTE_BOLETA', 'DTE_FACTURA', 'DTE_GUIA_DESPACHO', 'DTE_NOTA_CREDITO'] },
  ];
  const known = new Set(groups.flatMap(g => g.codes));
  const custom = data?.catalog.filter(m => !known.has(m.code) && m.code !== 'EXTRA_BRANCH').map(m => m.code) || [];
  if (custom.length) groups.push({ name: 'Otros servicios', codes: custom });
  return <div className="space-y-5">
    <div><h2 className="font-semibold text-lg">Servicios y módulos</h2><p className="mt-1 text-sm text-muted-foreground">Activa o desactiva servicios para esta empresa, incluso si están incluidos en su plan. “Usar base” restaura la configuración del plan y sus complementos.</p></div>
    {groups.map(group => <section key={group.name} className={cardClass}>
      <h3 className="font-semibold mb-2">{group.name}</h3>
      <div className="divide-y divide-border">{data?.catalog.filter(m => group.codes.includes(m.code)).map(mod => {
        const choice = choices[mod.id];
        const enabled = mod.isActive && (typeof choice === 'boolean' ? choice : inherited.has(mod.code));
        return <div key={mod.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 sm:pr-4"><p className="font-medium">{mod.name}</p><p className="mt-1 text-xs text-muted-foreground">{mod.description}</p><p className="mt-1 text-xs text-muted-foreground">{!mod.isActive ? 'Deshabilitado en el catálogo general' : typeof choice === 'boolean' ? 'Decisión específica de este cliente' : planIds.has(mod.id) ? 'Configuración del plan' : 'Configuración base'}</p></div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" role="switch" aria-checked={enabled} aria-label={'Habilitar ' + mod.name} disabled={!mod.isActive || saving} onClick={() => setChoices(prev => ({ ...prev, [mod.id]: !enabled }))} className={'inline-flex min-w-28 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 ' + (enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border')}>{enabled && <ShieldCheck size={14} />}{enabled ? 'Habilitado' : 'Deshabilitado'}</button>
            <button type="button" className={secondaryClass + ' text-xs'} title="Restaurar la configuración base de este servicio" disabled={saving || typeof choice !== 'boolean'} onClick={() => setChoices(prev => ({ ...prev, [mod.id]: null }))}><RotateCcw size={13} />Usar base</button>
          </div>
        </div>;
      })}</div>
    </section>)}
    <p className="text-sm text-muted-foreground">La creación y habilitación de locales se gestiona individualmente en Sucursales; su capacidad se ajusta en Suscripción y límites.</p>
    <button className={primaryClass} disabled={saving} onClick={save}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Guardando...' : 'Guardar servicios'}</button>
  </div>;
}
