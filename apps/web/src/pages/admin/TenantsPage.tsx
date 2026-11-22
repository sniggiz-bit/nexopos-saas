import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, ChevronLeft, ChevronRight, Search, Users, Store, Plus } from 'lucide-react';
import api from '../../lib/api';
import CreateClientDialog from './CreateClientDialog';
import { cardClass, errorMessage, fieldClass, money, primaryClass, secondaryClass } from './client-record';

interface Client {
  id: string; name: string; rut: string | null; status: string; createdAt: string;
  owner: { name: string | null; email: string; isActive?: boolean };
  plan: { name: string; price: number } | null;
  activeBranches: number;
  _count: { users: number; branches: number; products: number };
}
export default function TenantsPage() {
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState({ search: '', status: '', page: 1 });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => { const timeout = window.setTimeout(() => setFilter(prev => ({ ...prev, search: query.trim(), page: 1 })), 300); return () => window.clearTimeout(timeout); }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api.get('/admin/tenants', { signal: controller.signal, params: { search: filter.search || undefined, status: filter.status || undefined, page: filter.page, limit: 15 } })
      .then(res => { if (!controller.signal.aborted) { setClients(res.data.data); setTotal(res.data.total); setPages(Math.max(1, res.data.lastPage)); } })
      .catch(err => { if (!controller.signal.aborted) setError(errorMessage(err, 'No se pudo cargar el listado de clientes.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, revision]);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-cyan-500">Administración de empresas</p><h1 className="mt-1 text-2xl font-bold">Gestión de clientes</h1><p className="mt-2 text-sm text-muted-foreground">Abre la ficha de cada cliente para gestionar sus usuarios, servicios y sucursales.</p></div><div className="flex flex-wrap items-center gap-3"><button className={primaryClass} onClick={() => setCreating(true)}><Plus size={16} />Nuevo cliente</button><div className="rounded-xl border border-border bg-card px-4 py-3"><strong className="text-2xl">{total}</strong><span className="ml-2 text-sm text-muted-foreground">{filter.search || filter.status ? 'resultados' : 'clientes registrados'}</span></div></div></header>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-3 text-muted-foreground" /><input aria-label="Buscar clientes" className={fieldClass + ' pl-10'} value={query} onChange={e => setQuery(e.target.value)} maxLength={200} placeholder="Buscar por empresa, RUT, usuario o correo..." /></div><select aria-label="Filtrar clientes por estado" className={fieldClass + ' sm:!w-56'} value={filter.status} onChange={e => setFilter(prev => ({ ...prev, status: e.target.value, page: 1 }))}><option value="">Todos los estados</option><option value="ACTIVE">Activos</option><option value="SUSPENDED">Suspendidos</option></select></div>
    {error ? <div className={cardClass}><p role="alert" className="mb-4 text-red-400">{error}</p><button className={secondaryClass} onClick={() => setRevision(v => v + 1)}>Reintentar</button></div> : loading ? <div className="space-y-3" aria-label="Cargando clientes">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div> : !clients.length ? <div className={cardClass + ' py-12 text-center'}><Building2 size={32} className="mx-auto mb-3 text-muted-foreground" /><h2 className="font-semibold">Sin clientes con estos filtros</h2><p className="mt-2 text-sm text-muted-foreground">Prueba con otro nombre, correo o estado.</p></div> : <>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card xl:block"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr>{['Empresa', 'Administrador', 'Plan', 'Recursos', 'Estado', 'Registro', 'Ficha'].map(label => <th className="px-5 py-4 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{clients.map(client => <tr key={client.id} className="hover:bg-muted/30"><td className="px-5 py-5"><Link className="font-semibold text-foreground hover:text-cyan-500" to={'/admin/tenants/' + client.id}>{client.name}</Link><p className="mt-1 text-xs text-muted-foreground">{client.rut || 'Sin RUT'}</p></td><td className="px-5 py-5"><p>{client.owner?.name || 'Sin administrador'}</p><p className="mt-1 text-xs text-muted-foreground break-all">{client.owner?.email || '—'}</p></td><td className="px-5 py-5"><p>{client.plan?.name || 'Acceso básico'}</p>{client.plan && <p className="mt-1 text-xs text-muted-foreground">{money(client.plan.price)} / mes</p>}</td><td className="px-5 py-5"><Resources client={client} /></td><td className="px-5 py-5"><Status value={client.status} /></td><td className="px-5 py-5 text-muted-foreground">{new Date(client.createdAt).toLocaleDateString('es-CL')}</td><td className="px-5 py-5"><Link className={secondaryClass + ' whitespace-nowrap text-cyan-500'} to={'/admin/tenants/' + client.id}>Abrir ficha<ArrowUpRight size={15} /></Link></td></tr>)}</tbody></table></div>
      <div className="grid gap-4 md:grid-cols-2 xl:hidden">{clients.map(client => <article key={client.id} className={cardClass + ' space-y-4'}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-semibold text-lg break-words hover:text-cyan-500" to={'/admin/tenants/' + client.id}>{client.name}</Link><p className="mt-1 text-xs text-muted-foreground">{client.rut || 'Sin RUT'}</p></div><Status value={client.status} /></div><div><p className="text-sm">{client.owner?.name || 'Sin administrador'}</p><p className="text-xs text-muted-foreground break-all">{client.owner?.email || '—'}</p></div><Resources client={client} /><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><span className="text-sm text-muted-foreground">{client.plan?.name || 'Acceso básico'}</span><Link className={secondaryClass + ' text-cyan-500'} to={'/admin/tenants/' + client.id}>Abrir ficha<ArrowUpRight size={15} /></Link></div></article>)}</div>
    </>}
    {!error && pages > 1 && <nav aria-label="Páginas de clientes" className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Página {filter.page} de {pages}</span><div className="flex gap-2"><button className={secondaryClass} aria-label="Página anterior" disabled={loading || filter.page <= 1} onClick={() => setFilter(prev => ({ ...prev, page: prev.page - 1 }))}><ChevronLeft size={16} /></button><button className={secondaryClass} aria-label="Página siguiente" disabled={loading || filter.page >= pages} onClick={() => setFilter(prev => ({ ...prev, page: prev.page + 1 }))}><ChevronRight size={16} /></button></div></nav>}
    {creating && <CreateClientDialog onClose={() => setCreating(false)} />}
  </div>;
}
function Status({ value }: { value: string }) { return <span className={'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' + (value === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400')}>{value === 'ACTIVE' ? 'Activo' : 'Suspendido'}</span>; }
function Resources({ client }: { client: Client }) { return <div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Users size={13} />{client._count.users} usuarios</span><span className="inline-flex items-center gap-1"><Store size={13} />{client.activeBranches ?? 0}/{client._count.branches} habilitadas</span></div>; }
