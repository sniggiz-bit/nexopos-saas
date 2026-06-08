import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { getTransbankConfig, saveTransbankConfig, type TransbankBranchSettings } from '@/api/transbank';
import { checkAgentStatus, type AgentStatus } from '@/services/transbank-agent';
import {
  CheckCircle2, RefreshCw, Save,
  Terminal, Wifi, WifiOff, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BAUD_OPTIONS = [9600, 19200, 38400, 57600, 115200];

export function TransbankConfigPage() {
  const { user }        = useAuth();
  const branchId        = user?.branchId ?? '';
  const queryClient     = useQueryClient();

  // Estado del agente (se consulta en browser, no en backend)
  const [agentStatus, setAgentStatus]   = useState<AgentStatus | null>(null);
  const [agentChecking, setAgentChecking] = useState(false);

  // Formulario
  const [comPort,   setComPort]   = useState('COM3');
  const [baudRate,  setBaudRate]  = useState(115200);
  const [mockMode,  setMockMode]  = useState(false);
  const [agentPort, setAgentPort] = useState(7777);
  const [saved, setSaved]         = useState(false);

  // Cargar config guardada
  const { data: config, isLoading } = useQuery({
    queryKey: ['transbank-config', branchId],
    queryFn:  () => getTransbankConfig(branchId),
    enabled:  !!branchId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (config) {
      setComPort(config.settings.comPort);
      setBaudRate(config.settings.baudRate);
      setMockMode(config.settings.mockMode);
      setAgentPort(config.settings.agentPort);
    }
  }, [config]);

  // Guardar config
  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (s: TransbankBranchSettings) => saveTransbankConfig(branchId, s),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['transbank-config', branchId] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () =>
    save({ comPort, baudRate, mockMode, agentPort });

  // Verificar agente en vivo
  const checkAgent = useCallback(async () => {
    setAgentChecking(true);
    try {
      const s = await checkAgentStatus();
      setAgentStatus(s);
    } catch {
      setAgentStatus({ ok: false, connected: false });
    } finally {
      setAgentChecking(false);
    }
  }, []);

  useEffect(() => { checkAgent(); }, [checkAgent]);

  // Comando de inicio generado según la config actual
  const startCmd = mockMode
    ? `$env:MOCK_MODE="true"; $env:PORT="${agentPort}"; node index.js`
    : `$env:COM_PORT="${comPort}"; $env:BAUD_RATE="${baudRate}"; $env:PORT="${agentPort}"; node index.js`;

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-6">

                <div>
                    <h1 className="text-2xl font-black text-white">Terminal Transbank</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Configuración del agente local y terminal POS Integrado para esta sucursal.
                    </p>
                </div>

                {/* ── Estado del agente ── */}
                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-[#00D4FF]" /> Estado del agente local
                        </h2>
                        <Button variant="ghost" size="sm" onClick={checkAgent} disabled={agentChecking} className="text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            <RefreshCw className={`w-4 h-4 mr-1.5 ${agentChecking ? 'animate-spin' : ''}`} />
                            Verificar
                        </Button>
                    </div>

                    {agentStatus === null ? (
                        <div className="h-14 bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] rounded-xl animate-pulse" />
                    ) : agentStatus.ok ? (
                        <div className="flex items-start gap-4 bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.15)] rounded-xl p-4">
                            <CheckCircle2 className="w-6 h-6 text-[#10B981] mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="font-bold text-[#10B981]">Agente corriendo en localhost:{agentStatus.connected ? agentPort : 7777}</p>
                                <p className="text-xs text-gray-400 font-mono">
                                    {agentStatus.mockMode
                                        ? 'Modo simulador activo — sin hardware real'
                                        : `Puerto: ${agentStatus.port ?? '—'}  ·  Terminal: ${agentStatus.terminalId ?? '—'}`}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-4 bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.15)] rounded-xl p-4">
                            <WifiOff className="w-6 h-6 text-red-400 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="font-bold text-red-400">Agente no disponible</p>
                                <p className="text-xs text-gray-400">
                                    El proceso no está corriendo en localhost:{agentPort}. Usa el comando de inicio abajo.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Configuración ── */}
                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-sm">
                    <h2 className="font-bold text-white">Configuración del terminal</h2>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        <>
                            {/* Modo mock */}
                            <div className="flex items-center justify-between py-3 border-b border-[rgba(0,212,255,0.05)]">
                                <div>
                                    <Label className="font-semibold text-white">Modo simulador</Label>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Actívalo para probar sin hardware. Nunca en producción.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setMockMode(v => !v)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        mockMode ? 'bg-[#F59E0B]' : 'bg-gray-800'
                                    }`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                        mockMode ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Puerto COM */}
                            <div className="space-y-1.5">
                                <Label className="font-semibold text-gray-400">Puerto COM del terminal</Label>
                                <p className="text-xs text-gray-500">
                                    Windows: COM3, COM4… · Linux/Mac: /dev/ttyUSB0
                                </p>
                                <Input
                                    value={comPort}
                                    onChange={e => setComPort(e.target.value)}
                                    placeholder="COM3"
                                    disabled={mockMode}
                                    className="max-w-xs bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] font-mono outline-none"
                                />
                            </div>

                            {/* Baud rate */}
                            <div className="space-y-1.5">
                                <Label className="font-semibold text-gray-400">Velocidad (baud rate)</Label>
                                <select
                                    value={baudRate}
                                    onChange={e => setBaudRate(Number(e.target.value))}
                                    disabled={mockMode}
                                    className="max-w-xs block px-3 py-2 text-sm border border-[rgba(0,212,255,0.15)] rounded-lg bg-[rgba(15,22,36,0.8)] text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] disabled:opacity-50"
                                >
                                    {BAUD_OPTIONS.map(b => (
                                        <option key={b} value={b} className="bg-[hsl(220,30%,8%)] text-white">{b.toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Puerto HTTP del agente */}
                            <div className="space-y-1.5">
                                <Label className="font-semibold text-gray-400">Puerto HTTP del agente</Label>
                                <p className="text-xs text-gray-500">
                                    Por defecto 7777. Cambia solo si hay conflicto.
                                </p>
                                <Input
                                    type="number"
                                    value={agentPort}
                                    onChange={e => setAgentPort(Number(e.target.value))}
                                    min={1024}
                                    max={65535}
                                    className="max-w-xs bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] font-mono outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <Button onClick={handleSave} disabled={saving || !branchId} className="gap-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all font-semibold rounded-lg">
                                    {saved
                                        ? <><CheckCircle2 className="w-4 h-4" /> Guardado</>
                                        : <><Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar configuración'}</>}
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Comando de inicio ── */}
                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-2xl p-6 space-y-3 shadow-sm">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#00D4FF]" /> Comando de inicio (PowerShell)
                    </h2>
                    <p className="text-xs text-gray-400">
                        Ejecuta esto en la PC del cajero, dentro de la carpeta <code className="bg-slate-900 border border-[rgba(0,212,255,0.08)] text-[#00D4FF] font-mono px-1 rounded">apps/transbank-agent</code>:
                    </p>
                    <pre className="bg-[hsl(220,30%,4%)] text-gray-300 border border-[rgba(0,212,255,0.08)] text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">
                        <code>{startCmd}</code>
                    </pre>
                    {mockMode && (
                        <div className="flex items-center gap-2 text-xs text-[#F59E0B] bg-[rgba(245,158,11,0.04)] border border-[rgba(245,158,11,0.15)] rounded-lg p-3">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                            Modo simulador activo — los pagos no se procesarán en el terminal físico.
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}
