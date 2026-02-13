import { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Trash, Plus, CheckCircle, AlertTriangle } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'INFO' | 'WARNING';
    isActive: boolean;
    createdAt: string;
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', type: 'INFO', isActive: true });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/announcements`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/announcements`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchAnnouncements();
            setIsModalOpen(false);
            setFormData({ title: '', content: '', type: 'INFO', isActive: true });
        } catch (error) {
            console.error('Error creating announcement:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar comunicado?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/announcements/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const toggleStatus = async (announcement: Announcement) => {
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/announcements/${announcement.id}`,
                { isActive: !announcement.isActive },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            fetchAnnouncements();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Comunicados</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    Nuevo Comunicado
                </button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center text-neutral-500 py-8">Cargando...</div>
                ) : announcements.map((announcement) => (
                    <div key={announcement.id} className={`bg-neutral-800 border-l-4 rounded-r-xl p-6 relative ${announcement.type === 'WARNING' ? 'border-l-yellow-500' : 'border-l-blue-500'
                        } ${!announcement.isActive ? 'opacity-50' : ''}`}>
                        <div className="absolute top-4 right-4 flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${announcement.isActive ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-400'}`}>
                                {announcement.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            <button onClick={() => toggleStatus(announcement)} className="text-neutral-400 hover:text-white" title="Cambiar Estado">
                                <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleDelete(announcement.id)} className="text-red-400 hover:text-red-300" title="Eliminar">
                                <Trash size={18} />
                            </button>
                        </div>
                        <div className="flex items-start gap-3">
                            {announcement.type === 'WARNING' ? <AlertTriangle className="text-yellow-500 mt-1" /> : <Megaphone className="text-blue-500 mt-1" />}
                            <div>
                                <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
                                <p className="text-neutral-300 mt-1">{announcement.content}</p>
                                <div className="text-xs text-neutral-500 mt-3">
                                    Publicado el: {new Date(announcement.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Nuevo Comunicado</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Contenido</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 h-24"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="INFO">Información</option>
                                    <option value="WARNING">Advertencia</option>
                                </select>
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
                                    Publicar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
