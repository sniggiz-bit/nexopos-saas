import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Megaphone, Trash2, Plus, CheckCircle2, AlertTriangle,
  Info, Loader2, Eye, EyeOff, X,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING';
  isActive: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  INFO: { icon: Info, color: 'text-blue-400', border: 'border-l-blue-500', bg: 'bg-blue-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-400', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10' },
} as const;

const EMPTY_FORM = { title: '', content: '', type: 'INFO' as 'INFO' | 'WARNING', isActive: true };

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar comunicados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/announcements', formData);
      toast.success('Comunicado publicado');
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchAnnouncements();
    } catch {
      toast.error('Error al publicar el comunicado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este comunicado? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Comunicado eliminado');
    } catch {
      toast.error('Error al eliminar el comunicado');
    }
  };

  const toggleStatus = async (announcement: Announcement) => {
    const next = !announcement.isActive;
    try {
      await api.patch(`/announcements/${announcement.id}`, { isActive: next });
      setAnnouncements(prev => prev.map(a => a.id === announcement.id ? { ...a, isActive: next } : a));
      toast.success(next ? 'Comunicado activado' : 'Comunicado desactivado');
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {loading ? 'Cargando...' : `${announcements.length} comunicado${announcements.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20 text-sm"
        >
          <Plus size={17} />Nuevo Comunicado
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-neutral-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Cargando comunicados...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-neutral-700 rounded-xl text-neutral-500">
          <Megaphone size={38} className="mb-3 opacity-20" />
          <p className="font-semibold text-neutral-400">Sin comunicados publicados</p>
          <p className="text-sm mt-1">Crea el primero para notificar a tus clientes</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            <Plus size={14} />Crear comunicado
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.INFO;
            return (
              <div
                key={ann.id}
                className={`bg-neutral-800 border border-neutral-700 border-l-4 ${cfg.border} rounded-r-xl p-5 transition-opacity ${!ann.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0 mt-0.5`}>
                    <cfg.icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground">{ann.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
                        ${ann.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-700 text-neutral-500 border-neutral-600'}`}>
                        <CheckCircle2 size={9} />
                        {ann.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300">{ann.content}</p>
                    <p className="text-xs text-neutral-600 mt-2">
                      {new Date(ann.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleStatus(ann)}
                      className={`p-2 rounded-lg transition-colors ${ann.isActive
                        ? 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
                        : 'text-emerald-400 hover:bg-emerald-900/30'}`}
                      title={ann.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {ann.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-foreground">Nuevo Comunicado</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Se mostrará a todos los clientes activos</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['INFO', 'WARNING'] as const).map(type => {
                      const cfg = TYPE_CONFIG[type];
                      const active = formData.type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, type }))}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors
                            ${active ? `${cfg.bg} ${cfg.color} border-current` : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
                        >
                          <cfg.icon size={15} />
                          {type === 'INFO' ? 'Información' : 'Advertencia'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ej. Mantenimiento programado"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Contenido</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.content}
                    onChange={e => setFormData(f => ({ ...f, content: e.target.value }))}
                    placeholder="Describe el comunicado que verán tus clientes..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-neutral-800 space-y-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                  {submitting ? 'Publicando...' : 'Publicar comunicado'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl text-neutral-400 hover:text-white text-sm font-medium transition-colors hover:bg-neutral-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
