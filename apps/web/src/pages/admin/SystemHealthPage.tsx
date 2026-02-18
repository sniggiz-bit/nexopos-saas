import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Info } from 'lucide-react';

interface Log {
    id: string;
    level: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    context: any;
    createdAt: string;
    tenant?: {
        name: string;
    };
}

export default function SystemHealthPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filterLevel]);

    const fetchLogs = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/system-logs`, {
                params: { level: filterLevel },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertTriangle className="text-red-400" size={18} />;
            case 'WARNING': return <Activity className="text-yellow-400" size={18} />;
            default: return <Info className="text-blue-400" size={18} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Monitor del Sistema</h1>
                <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">Todos los niveles</option>
                    <option value="ERROR">Errores</option>
                    <option value="WARNING">Advertencias</option>
                    <option value="INFO">Información</option>
                </select>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-900 border-b border-neutral-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nivel</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Mensaje</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-700">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-500">Cargando logs...</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-neutral-750 font-mono text-sm">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getIcon(log.level)}
                                            <span className={
                                                log.level === 'ERROR' ? 'text-red-400' :
                                                    log.level === 'WARNING' ? 'text-yellow-400' : 'text-blue-400'
                                            }>{log.level}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-300">
                                        {log.message}
                                        {log.context && (
                                            <pre className="mt-1 text-xs text-neutral-500 overflow-x-auto max-w-xs">{JSON.stringify(log.context)}</pre>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-neutral-400">{log.tenant?.name || 'Sistema'}</td>
                                    <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
