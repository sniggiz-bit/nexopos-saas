import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDteConfig, upsertDteConfig } from '@/api/dte-config';

export function SettingsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const tenantId = user?.tenantId || '';

    const [liorenToken, setLiorenToken] = useState('');
    const [liorenLogo, setLiorenLogo] = useState('');
    const [dteResolution, setDteResolution] = useState('');
    const [resolutionDate, setResolutionDate] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const { data: config, isLoading } = useQuery({
        queryKey: ['dte-config', tenantId],
        queryFn: () => getDteConfig(tenantId),
        enabled: !!tenantId,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (config) {
            setLiorenToken(config.liorenToken || '');
            setLiorenLogo(config.liorenLogo || '');
            setDteResolution(config.dteResolution || '');
            setResolutionDate(
                config.resolutionDate ? config.resolutionDate.split('T')[0] : ''
            );
        }
    }, [config]);

    const { mutate: saveConfig, isPending } = useMutation({
        mutationFn: () =>
            upsertDteConfig({ tenantId, liorenToken, liorenLogo, dteResolution, resolutionDate }),
        onSuccess: () => {
            setSaveStatus('success');
            queryClient.invalidateQueries({ queryKey: ['dte-config', tenantId] });
            setTimeout(() => setSaveStatus('idle'), 3000);
        },
        onError: () => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        },
    });

    return (
        <DashboardLayout>
            <div className="max-w-3xl space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Configuración DTE (Lioren)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Configura la integración con Lioren para emitir documentos tributarios electrónicos.
                    </p>

                    {isLoading ? (
                        <div className="text-sm text-gray-400 py-4">Cargando configuración...</div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Token de Lioren
                                </label>
                                <input
                                    type="password"
                                    value={liorenToken}
                                    onChange={(e) => setLiorenToken(e.target.value)}
                                    placeholder="Ingresa tu token de API"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL del Logo
                                </label>
                                <input
                                    type="text"
                                    value={liorenLogo}
                                    onChange={(e) => setLiorenLogo(e.target.value)}
                                    placeholder="https://ejemplo.com/logo.png"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de Resolución SII
                                </label>
                                <input
                                    type="text"
                                    value={dteResolution}
                                    onChange={(e) => setDteResolution(e.target.value)}
                                    placeholder="Ej: 12345"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Resolución
                                </label>
                                <input
                                    type="date"
                                    value={resolutionDate}
                                    onChange={(e) => setResolutionDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <button
                                    onClick={() => saveConfig()}
                                    disabled={isPending || !tenantId}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {isPending ? 'Guardando...' : 'Guardar Configuración'}
                                </button>

                                {saveStatus === 'success' && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> Guardado correctamente
                                    </span>
                                )}
                                {saveStatus === 'error' && (
                                    <span className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> Error al guardar
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
