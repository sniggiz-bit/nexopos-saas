import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Calendar, Loader2, MapPin, Search, Store } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { useSuperAdminBranches, type SystemBranch } from '../../hooks/useSuperAdminBranches';
import { formatDate } from '../../utils/format';

const byName = new Intl.Collator('es-CL', { sensitivity: 'base', numeric: true });

function normalizeSearch(value: string) {
    return value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function groupByTenant(branches: SystemBranch[]) {
    const groups = new Map<string, { tenant: SystemBranch['tenant']; branches: SystemBranch[] }>();

    for (const branch of branches) {
        const group = groups.get(branch.tenantId);
        if (group) group.branches.push(branch);
        else groups.set(branch.tenantId, { tenant: branch.tenant, branches: [branch] });
    }

    return Array.from(groups.values())
        .sort((a, b) => byName.compare(a.tenant.name, b.tenant.name))
        .map(group => ({
            ...group,
            branches: group.branches.sort((a, b) =>
                Number(b.isMain) - Number(a.isMain) || byName.compare(a.name, b.name)
            ),
            activeCount: group.branches.filter(branch => branch.isActive).length,
        }));
}

export default function SuperAdminBranchesPage() {
    const { branches, loading, loadFailed, fetchBranches, pendingIds, toggleBranchStatus } = useSuperAdminBranches();
    const [searchTerm, setSearchTerm] = useState('');
    const groups = useMemo(() => groupByTenant(branches), [branches]);
    const query = normalizeSearch(searchTerm);
    const visibleGroups = groups.filter(({ tenant, branches }) =>
        !query || normalizeSearch(tenant.name).includes(query) || branches.some(branch =>
            normalizeSearch(branch.name).includes(query) || normalizeSearch(branch.address ?? '').includes(query)
        )
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h1 className="flex items-center gap-2.5 text-2xl font-bold text-foreground">
                    <Building2 className="shrink-0 text-primary" aria-hidden="true" /> Sucursales por cliente
                </h1>
                <div className="relative w-full md:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} aria-hidden="true" />
                    <Input
                        type="search"
                        aria-label="Buscar cliente, sucursal o dirección"
                        placeholder="Buscar cliente, sucursal o dirección"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="bg-card pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <p role="status" className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-12 text-sm text-muted-foreground">
                    <Loader2 size={17} className="animate-spin text-primary" aria-hidden="true" /> Cargando sucursales…
                </p>
            ) : loadFailed ? (
                <div className="rounded-xl border bg-card px-4 py-8 text-center">
                    <p role="alert" className="mb-3 text-sm text-foreground">No se pudieron cargar las sucursales.</p>
                    <Button variant="outline" size="sm" onClick={() => void fetchBranches()}>Reintentar</Button>
                </div>
            ) : visibleGroups.length === 0 ? (
                <p role="status" className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
                    {query ? 'No hay clientes ni sucursales que coincidan con la búsqueda.' : 'Aún no hay sucursales registradas.'}
                </p>
            ) : (
                <div className="space-y-4">
                    {visibleGroups.map(({ tenant, branches, activeCount }) => (
                        <section key={tenant.id} aria-labelledby={'tenant-' + tenant.id} className="rounded-xl border bg-card text-card-foreground">
                            <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-3.5 sm:px-5">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                                        <h2 id={'tenant-' + tenant.id} className="min-w-0 break-words text-base font-semibold">{tenant.name}</h2>
                                        <span className="text-xs uppercase text-muted-foreground" title={tenant.id}>ID {tenant.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'} · {activeCount} {activeCount === 1 ? 'activa' : 'activas'}
                                    </p>
                                </div>
                                <Button asChild size="sm" variant="outline">
                                    <Link to={'/admin/tenants/' + tenant.id + '?tab=branches'} aria-label={'Gestionar sucursales de ' + tenant.name}>
                                        Gestionar sucursales <ArrowRight aria-hidden="true" />
                                    </Link>
                                </Button>
                            </header>
                            <ul role="list" className="divide-y divide-border">
                                {branches.map(branch => (
                                    <li
                                        key={branch.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem_7.5rem]"
                                    >
                                        <div className="flex min-w-0 items-start gap-2.5">
                                            <Store size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <h3 className="min-w-0 break-words text-sm font-semibold">{branch.name}</h3>
                                                    {branch.isMain && <Badge variant="secondary">Matriz</Badge>}
                                                </div>
                                                <p className="mt-0.5 text-xs uppercase text-muted-foreground">ID {branch.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <p className="col-span-2 row-start-2 flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground md:col-span-1 md:row-start-auto">
                                            <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                                            <span className="min-w-0 break-words">{branch.address || 'Sin dirección'}</span>
                                        </p>
                                        <div className="col-span-2 row-start-3 flex items-center gap-1.5 text-xs text-muted-foreground md:col-span-1 md:row-start-auto">
                                            <Calendar size={14} className="shrink-0" aria-hidden="true" />
                                            <span className="sr-only">Registrada el </span>
                                            <time dateTime={branch.createdAt}>{formatDate(branch.createdAt)}</time>
                                        </div>
                                        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 md:col-start-auto md:row-start-auto">
                                            <label htmlFor={'branch-status-' + branch.id}>
                                                <span className="sr-only">Habilitar {branch.name} de {tenant.name}</span>
                                                <span
                                                    aria-hidden="true"
                                                    className={'text-xs font-semibold ' + (branch.isActive
                                                        ? 'text-emerald-700 dark:text-emerald-300'
                                                        : 'text-muted-foreground')}
                                                >
                                                    {branch.isActive ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </label>
                                            <Switch
                                                id={'branch-status-' + branch.id}
                                                checked={branch.isActive}
                                                disabled={pendingIds.has(branch.id)}
                                                onCheckedChange={checked => void toggleBranchStatus(branch.id, checked)}
                                                className="aria-[checked=false]:border-muted-foreground"
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
