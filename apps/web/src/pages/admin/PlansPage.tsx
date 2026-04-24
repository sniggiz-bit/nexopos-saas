import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';

interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    features?: string[];
    maxUsers: number;
    maxProducts: number;
    maxStorage: number;
    isRecommended?: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    // const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Plan>>({});
    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await apiClient.get('/plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiClient.patch(`/plans/${formData.id}`, formData);
            } else {
                await apiClient.post('/plans', formData);
            }
            fetchPlans();
            setIsModalOpen(false);
            setFormData({});
            setNewFeature('');
        } catch (error) {
            console.error('Error saving plan:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este plan?')) return;
        try {
            await apiClient.delete(`/plans/${id}`);
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    const addFeature = () => {
        if (!newFeature.trim()) return;
        const currentFeatures = formData.features || [];
        setFormData({ ...formData, features: [...currentFeatures, newFeature.trim()] });
        setNewFeature('');
    };

    const removeFeature = (index: number) => {
        const currentFeatures = formData.features || [];
        const updatedFeatures = [...currentFeatures];
        updatedFeatures.splice(index, 1);
        setFormData({ ...formData, features: updatedFeatures });
    };

    const handleKeyDownFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addFeature();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Planes y Precios</h1>
                <button
                    onClick={() => { setFormData({}); setNewFeature(''); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    Nuevo Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className={`bg-neutral-800 border ${plan.isRecommended ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-neutral-700'} rounded-xl p-6 relative flex flex-col`}>
                        {plan.isRecommended && (
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Recomendado
                            </span>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => { setFormData(plan); setNewFeature(''); setIsModalOpen(true); }} className="text-neutral-400 hover:text-white"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(plan.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                        {plan.description && <p className="text-sm text-neutral-400 mb-4 h-10 overflow-hidden line-clamp-2">{plan.description}</p>}
                        <p className="text-3xl font-bold text-purple-400 mb-4">${plan.price.toLocaleString()}</p>

                        <div className="flex-grow">
                            <ul className="space-y-2 text-neutral-300 text-sm mb-4">
                                <li>👥 {plan.maxUsers} Usuarios</li>
                                <li>📦 {plan.maxProducts} Productos</li>
                                <li>💾 {plan.maxStorage} MB Almacenamiento</li>
                            </ul>

                            {plan.features && plan.features.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-neutral-700">
                                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Características incluidas</h4>
                                    <ul className="space-y-1 text-sm text-neutral-300">
                                        {plan.features.slice(0, 3).map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <Check size={14} className="text-purple-400 mr-2 mt-0.5 shrink-0" />
                                                <span className="line-clamp-1">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.features.length > 3 && (
                                            <li className="text-neutral-500 italic text-xs mt-1">
                                                + {plan.features.length - 3} características más...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl my-8 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6 pr-8">{formData.id ? 'Editar Plan' : 'Nuevo Plan'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Columna Izquierda: Información Principal */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre del Plan</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="Ej. Plan Pro"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-1">Descripción Corta</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none h-20"
                                            placeholder="Breve descripción para la landing page..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-1">Precio (CLP)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price ?? ''}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                                        <div className="flex-1">
                                            <label htmlFor="isRecommended" className="text-sm font-medium text-white cursor-pointer select-none">Plan Destacado</label>
                                            <p className="text-xs text-neutral-400">Mostrar como el "Más popular" en la landing.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="isRecommended"
                                                className="sr-only peer"
                                                checked={formData.isRecommended || false}
                                                onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Columna Derecha: Detalles y Características */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-1">Max Usuarios</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.maxUsers ?? ''}
                                                onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-1">Max Productos</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.maxProducts ?? ''}
                                                onChange={(e) => setFormData({ ...formData, maxProducts: Number(e.target.value) })}
                                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-1">Max Almacenamiento (MB)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.maxStorage ?? ''}
                                            onChange={(e) => setFormData({ ...formData, maxStorage: Number(e.target.value) })}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Características del Plan</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                onKeyDown={handleKeyDownFeature}
                                                placeholder="Ej. Soporte 24/7"
                                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={addFeature}
                                                disabled={!newFeature.trim()}
                                                className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                                            >
                                                <Plus size={16} /> Añadir
                                            </button>
                                        </div>

                                        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3 min-h-[120px] max-h-[180px] overflow-y-auto">
                                            {(!formData.features || formData.features.length === 0) ? (
                                                <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-4">
                                                    <p className="text-sm text-center">Sin características añadidas.</p>
                                                    <p className="text-xs text-center mt-1">Escribe arriba y presiona "Añadir" o Enter.</p>
                                                </div>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {formData.features.map((feature, index) => (
                                                        <li key={index} className="flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded px-3 py-2 group">
                                                            <div className="flex items-start">
                                                                <Check size={14} className="text-purple-500 mr-2 mt-0.5 shrink-0" />
                                                                <span className="text-sm text-neutral-200">{feature}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFeature(index)}
                                                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 font-medium text-neutral-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-purple-600/20"
                                >
                                    Guardar Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
