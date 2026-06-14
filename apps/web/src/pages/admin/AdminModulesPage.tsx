import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data } = await api.get('/modules');
      setModules(data);
    } catch (error) {
      toast.error('Error al cargar módulos');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setModules(modules.map(m => m.id === id ? { ...m, price: newPrice } : m));
  };

  const saveModule = async (mod: any) => {
    try {
      // Assuming a PUT endpoint exists to update module price
      await api.patch(`/modules/${mod.id}`, { price: mod.price });
      toast.success(`Precio actualizado para ${mod.name}`);
    } catch (error) {
      toast.error('Error al actualizar precio');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-foreground" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-foreground">
      <h1 className="text-3xl font-bold mb-8">Administración de Módulos (SaaS)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => (
          <div key={mod.id} className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-xl font-bold mb-2">{mod.name}</h3>
            <p className="text-slate-400 text-sm mb-4">{mod.description}</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Precio Mensual (CLP)</label>
              <input
                type="number"
                value={mod.price || 0}
                onChange={(e) => handlePriceChange(mod.id, parseInt(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => saveModule(mod)}
              className="flex items-center gap-2 justify-center w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition"
            >
              <Save className="w-4 h-4" /> Guardar Precio
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
