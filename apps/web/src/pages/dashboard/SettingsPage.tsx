import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Save } from 'lucide-react';

export function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-3xl space-y-6">
                {/* DTE Configuration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Configuración DTE (Lioren)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Configura la integración con Lioren para emitir documentos tributarios electrónicos.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Token de Lioren
                            </label>
                            <input
                                type="password"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="pt-4">
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                                <Save className="w-5 h-5 mr-2" />
                                Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
