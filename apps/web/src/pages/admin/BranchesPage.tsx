import { Home, RefreshCw, Store } from 'lucide-react';
import { useBranches } from '../../hooks/useBranches';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';

export default function BranchesPage() {
  const { branches, loading, fetchBranches } = useBranches();
  return <DashboardLayout>
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Sucursales</h1><p className="mt-1 text-sm text-muted-foreground">Consulta las ubicaciones de tu negocio y su estado de habilitación.</p></div><button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50" disabled={loading} onClick={() => fetchBranches()}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Actualizar</button></header>
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-muted-foreground">La creación y habilitación de sucursales la realiza el superadmin. Para solicitar una sucursal adicional o un cambio, envía un mensaje desde el chat de soporte de tu panel.</div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-muted-foreground">Cargando sucursales...</p> : branches.length ? branches.map(branch => <article key={branch.id} className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><span className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500"><Store size={24} /></span><div className="flex flex-col items-end gap-2">{branch.isMain && <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-500"><Home size={12} />Matriz</span>}<span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + (branch.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400')}>{branch.isActive ? 'Habilitada' : 'Deshabilitada'}</span></div></div>
          <h2 className="text-lg font-semibold break-words">{branch.name}</h2><p className="mt-2 text-sm text-muted-foreground">{branch.address || 'Sin dirección registrada'}</p>
          {!branch.isActive && <p className="mt-4 text-xs text-red-400">Esta sucursal no está habilitada para registrar nuevas operaciones.</p>}
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">Registrada el {new Date(branch.createdAt).toLocaleDateString('es-CL')}</p>
        </article>) : <p className="rounded-xl border border-dashed border-border p-8 text-muted-foreground">No hay sucursales registradas. Solicita su creación al superadmin desde el chat de soporte.</p>}
      </div>
    </div>
  </DashboardLayout>;
}
