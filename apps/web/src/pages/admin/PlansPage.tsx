import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Plan {
    id: string;
    name: string;
    price: number;
    maxUsers: number;
    maxProducts: number;
    maxStorage: number;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Plan>>({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/plans`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
            if (formData.id) {
                await axios.patch(`${import.meta.env.VITE_API_URL}/plans/${formData.id}`, formData, { headers });
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/plans`, formData, { headers });
            }
            fetchPlans();
            setIsModalOpen(false);
            setFormData({});
        } catch (error) {
            console.error('Error saving plan:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este plan?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/plans/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Planes y Precios</h1>
                <button
                    onClick={() => { setFormData({}); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    Nuevo Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => { setFormData(plan); setIsModalOpen(true); }} className="text-neutral-400 hover:text-white"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(plan.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-3xl font-bold text-purple-400 mb-4">${plan.price.toLocaleString()}</p>
                        <ul className="space-y-2 text-neutral-300 text-sm">
                            <li>👥 {plan.maxUsers} Usuarios</li>
                            <li>📦 {plan.maxProducts} Productos</li>
                            <li>💾 {plan.maxStorage} MB Almacenamiento</li>
                        </ul>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">{formData.id ? 'Editar Plan' : 'Nuevo Plan'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Precio (CLP)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price || ''}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">Max Usuarios</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.maxUsers || ''}
                                        onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">Max Productos</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.maxProducts || ''}
                                        onChange={(e) => setFormData({ ...formData, maxProducts: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Max Almacenamiento (MB)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.maxStorage || ''}
                                    onChange={(e) => setFormData({ ...formData, maxStorage: Number(e.target.value) })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-neutral-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
