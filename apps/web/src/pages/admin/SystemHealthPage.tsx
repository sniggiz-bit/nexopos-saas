import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Activity, AlertTriangle, Info, RefreshCw, Loader2, ServerCrash } from 'lucide-react';

interface Log {
  id: string;
  level: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  context: any;
  createdAt: string;
  tenant?: { name: string };
}

const LEVEL_CONFIG = {
  ERROR: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  WARNING: { icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const;

export default function SystemHealthPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLevel, setFilterLevel] = useState('');

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/system-logs', { params: { level: filterLevel || undefined } });
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar los logs del sistema');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterLevel]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const counts = logs.reduce(
    (acc, l) => ({ ...acc, [l.level]: (acc[l.level] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitor del Sistema</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {loading ? 'Cargando...' : `${logs.length} evento${logs.length !== 1 ? 's' : ''} registrado${logs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="">Todos los niveles</option>
            <option value="ERROR">Errores</option>
            <option value="WARNING">Advertencias</option>
            <option value="INFO">Información</option>
          </select>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary badges */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center gap-3">
          {(['ERROR', 'WARNING', 'INFO'] as const).map(level => {
            const cfg = LEVEL_CONFIG[level];
            const count = counts[level] ?? 0;
            if (!count) return null;
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(filterLevel === level ? '' : level)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
                  ${filterLevel === level ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
              >
                <cfg.icon size={11} />
                {level} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-neutral-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <ServerCrash size={40} className="mb-3 opacity-20" />
            <p className="font-semibold text-neutral-400">Sin eventos registrados</p>
            <p className="text-sm mt-1">
              {filterLevel ? `No hay eventos de tipo ${filterLevel}` : 'El sistema no ha registrado eventos aún'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-900 border-b border-neutral-700">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nivel</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Mensaje</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Tenant</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/60">
                {logs.map(log => {
                  const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.INFO;
                  return (
                    <tr key={log.id} className="hover:bg-neutral-700/30 transition-colors font-mono text-sm">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          <cfg.icon size={10} />
                          {log.level}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-300 max-w-sm">
                        <p className="truncate">{log.message}</p>
                        {log.context && (
                          <pre className="mt-1 text-xs text-neutral-500 overflow-x-auto max-w-xs whitespace-pre-wrap break-all">
                            {typeof log.context === 'string' ? log.context : JSON.stringify(log.context, null, 2)}
                          </pre>
                        )}
                      </td>
                      <td className="px-5 py-4 text-neutral-400 whitespace-nowrap">
                        {log.tenant?.name ?? <span className="text-neutral-600 italic">Sistema</span>}
                      </td>
                      <td className="px-5 py-4 text-neutral-500 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
