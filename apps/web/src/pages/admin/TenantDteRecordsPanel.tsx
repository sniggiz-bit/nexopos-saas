import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FileText, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { LocalDteRecords } from '../../api/dte-config';
import { cardClass, errorMessage, secondaryClass } from './client-record';

const states: Record<string, string> = { EMITIDO: 'Emitido; falta estado SII', PENDIENTE_SII: 'Pendiente SII', REPARO: 'Con reparo' };
export default function TenantDteRecordsPanel({ tenantId }: { tenantId: string }) {
  const query = useQuery({
    queryKey: ['admin-dte-records', tenantId],
    queryFn: async ({ signal }) => (await api.get<LocalDteRecords>('/admin/tenants/' + tenantId + '/dte-records', { signal })).data,
    enabled: !!tenantId, retry: 1,
  });
  if (query.isLoading) return <p className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="animate-spin" size={18} />Cargando registros tributarios...</p>;
  if (query.isError || !query.data) return <div className={cardClass}><p role="alert" className="mb-3 text-red-400">{errorMessage(query.error, 'No se pudo cargar el diagnóstico tributario.')}</p><button className={secondaryClass} onClick={() => query.refetch()}>Reintentar</button></div>;
  const data = query.data;
  const metrics = [
    { label: 'Con emisión verificada', value: data.confirmed, detail: 'Documento contrastado con Lioren; su estado SII puede seguir pendiente.' },
    { label: 'Por conciliar', value: data.unverified, detail: 'Folio o enlace local sin una confirmación verificable.' },
    { label: 'Con error o bloqueados', value: data.errors, detail: 'Intentos locales, incluidos los históricos. No equivale a rechazos del SII.' },
    { label: 'Pendientes de estado', value: data.pending, detail: 'Emisiones en proceso, sin confirmación o con estado SII pendiente.' },
  ];
  return <div className="space-y-5">
    <section className={cardClass}>
      <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><FileText size={20} className="text-cyan-500" />Control de registros de NexoPOS</h2><p className="mt-2 text-sm text-muted-foreground">Diagnóstico local de este cliente para seguimiento y conciliación.</p></div><button className={secondaryClass} disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={15} className={query.isFetching ? 'animate-spin' : ''} />Actualizar registros</button></header>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => <div className="rounded-xl border border-border p-4" key={metric.label}><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{metric.value.toLocaleString('es-CL')}</p><p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p></div>)}</div>
      <p className="mt-4 text-xs text-muted-foreground">Estas categorías pueden coincidir en un mismo registro. No se suman entre sí ni a las métricas oficiales de Lioren que consulta el cliente.</p>
      {data.unverified > 0 && <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-500"><AlertTriangle size={18} className="shrink-0" />Hay registros sin confirmación verificable. Se conserva el historial para contrastarlo con Lioren; no se reemiten automáticamente.</p>}
      {data.needsSupport > 0 && <p className="mt-4 text-sm text-amber-500">Hay {data.needsSupport.toLocaleString('es-CL')} intentos de la integración actual que requieren revisión. Comprueba el estado en Lioren antes de realizar otra emisión.</p>}
      {!data.confirmed && !data.unverified && !data.errors && !data.pending && <p className="mt-4 text-sm text-muted-foreground">Este cliente no tiene registros tributarios locales. Puede tener documentos emitidos directamente en Lioren.</p>}
    </section>
    {data.reviewDocs.length > 0 && <section className={cardClass}><h3 className="font-semibold">Documentos con estado pendiente</h3><p className="mt-2 text-sm text-muted-foreground">Últimos 20 documentos identificados en Lioren cuyo estado requiere seguimiento. El cliente puede consultar su estado desde Configuración.</p><div className="mt-4 divide-y divide-border">{data.reviewDocs.map(doc => <div key={doc.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><p>Tipo {doc.dteType} · Folio {doc.dteFolio}</p><span className="text-muted-foreground">{states[doc.dteStatus] || doc.dteStatus}</span></div>)}</div></section>}
  </div>;
}
