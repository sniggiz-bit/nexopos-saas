import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { formatRut, validateRut } from '@nexopos/shared';
import { apiClient } from '../../api/client';
import { cn } from '../../lib/utils';

export interface BusinessRegistrationData { rut: string; companyName: string; giro: string; address: string }
interface LookupResult { success: boolean; data?: { reasonSocial?: string; giro?: string; address?: string } }
interface Props {
  values: BusinessRegistrationData;
  onChange: (update: (current: BusinessRegistrationData) => BusinessRegistrationData) => void;
  disabled?: boolean;
  inputClassName?: string;
}
const keyOf = (rut: string) => rut.replace(/[.-]/g, '').trim().toUpperCase();
const fields = ['companyName', 'giro', 'address'] as const;
const baseInput = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50';

export default function BusinessRegistrationFields({ values, onChange, disabled = false, inputClassName }: Props) {
  const id = useId();
  const latest = useRef({ values, onChange });
  latest.current = { values, onChange };
  const automatic = useRef<Partial<BusinessRegistrationData>>({});
  const [touched, setTouched] = useState(false);
  const [retry, setRetry] = useState(0);
  const [lookup, setLookup] = useState({ key: '', state: 'idle', message: '' });
  const rutKey = keyOf(values.rut);
  const valid = validateRut(values.rut);
  const inputClass = cn(baseInput, inputClassName);

  useEffect(() => {
    if (!valid || disabled) return;
    const controller = new AbortController();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const starting = { ...latest.current.values };
      const previous = { ...automatic.current };
      setLookup({ key: rutKey, state: 'loading', message: 'Consultando datos del RUT...' });
      try {
        const { data } = await apiClient.get<LookupResult>('/common/registration-rut-lookup/' + encodeURIComponent(formatRut(starting.rut)), { signal: controller.signal });
        if (cancelled) return;
        if (!data.success || !data.data) {
          setLookup({ key: rutKey, state: 'empty', message: 'No hay datos disponibles para este RUT. Puedes completarlos manualmente.' });
          return;
        }
        const suggested = { companyName: data.data.reasonSocial?.trim().slice(0, 150) || '', giro: data.data.giro?.trim().slice(0, 150) || '', address: data.data.address?.trim().slice(0, 300) || '' };
        latest.current.onChange(current => {
          if (keyOf(current.rut) !== rutKey) return current;
          const next = { ...current };
          for (const field of fields) {
            if (suggested[field] && current[field] === starting[field] && (!starting[field].trim() || starting[field] === previous[field])) next[field] = suggested[field];
          }
          return next;
        });
        automatic.current = suggested;
        setLookup({ key: rutKey, state: 'success', message: 'Datos del RUT consultados. Revisa la razón social, el giro y la dirección antes de guardar.' });
      } catch {
        if (!cancelled) setLookup({ key: rutKey, state: 'error', message: 'No se pudo consultar el RUT. Puedes completar los datos manualmente o reintentar.' });
      }
    }, 400);
    return () => { cancelled = true; window.clearTimeout(timer); controller.abort(); };
  }, [rutKey, valid, disabled, retry]);

  const changeRut = (value: string) => {
    const rut = formatRut(value);
    const changed = keyOf(rut) !== rutKey;
    const previous = automatic.current;
    onChange(current => {
      const next = { ...current, rut };
      if (changed) for (const field of fields) if (previous[field] && current[field] === previous[field]) next[field] = '';
      return next;
    });
    if (changed) { automatic.current = {}; setTouched(false); setLookup({ key: '', state: 'idle', message: '' }); }
  };
  const state = lookup.key === rutKey ? lookup.state : 'idle';
  const invalid = !!values.rut && !valid;
  return <div className="space-y-4">
    <div>
      <label htmlFor={id + '-rut'} className="block text-sm">RUT del negocio (opcional)</label>
      <div className="relative mt-1">
        <input id={id + '-rut'} ref={node => { node?.setCustomValidity(invalid ? 'Ingresa un RUT válido o deja este campo vacío.' : ''); }} className={cn(inputClass, state === 'loading' && 'pr-10')} maxLength={20} autoComplete="off" placeholder="12.345.678-5" value={values.rut} disabled={disabled} aria-describedby={id + '-lookup'} aria-invalid={invalid && touched} onBlur={() => setTouched(true)} onChange={event => changeRut(event.target.value)} />
        {state === 'loading' && <Loader2 size={17} className="absolute right-3 top-3 animate-spin text-cyan-500" aria-hidden="true" />}
      </div>
      <p id={id + '-lookup'} role="status" aria-live="polite" className={cn('mt-2 text-sm', invalid && touched ? 'text-red-400' : 'text-muted-foreground')}>
        {invalid && touched ? 'Revisa el RUT y su dígito verificador.' : state === 'idle' ? 'Ingresa el RUT completo para consultar los datos de la empresa. También puedes completarlos manualmente.' : lookup.message}
      </p>
      {(state === 'empty' || state === 'error') && <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-500 hover:underline disabled:opacity-50" disabled={disabled} onClick={() => setRetry(value => value + 1)}><RefreshCw size={14} />Reintentar consulta</button>}
    </div>
    <label className="block text-sm">Nombre de la empresa<input className={inputClass + ' mt-1'} required maxLength={150} autoComplete="organization" value={values.companyName} disabled={disabled} onChange={event => onChange(current => ({ ...current, companyName: event.target.value }))} /></label>
    <label className="block text-sm">Giro comercial (opcional)<input className={inputClass + ' mt-1'} maxLength={150} value={values.giro} disabled={disabled} onChange={event => onChange(current => ({ ...current, giro: event.target.value }))} /></label>
    <label className="block text-sm">Dirección (opcional)<input className={inputClass + ' mt-1'} maxLength={300} autoComplete="street-address" value={values.address} disabled={disabled} onChange={event => onChange(current => ({ ...current, address: event.target.value }))} /></label>
  </div>;
}
