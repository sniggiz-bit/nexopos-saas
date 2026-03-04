import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../../../api/client';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export function UserFormModal({ isOpen, onClose, initialData }: UserFormModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CASHIER',
        branchId: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                password: '', // Leave blank when editing
                role: initialData.role || 'CASHIER',
                branchId: initialData.branch?.id || initialData.branchId || '',
            });
        } else {
            setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
        }
    }, [initialData, isOpen]);

    const { data: branches = [] } = useQuery({
        queryKey: ['branches', user?.tenantId],
        queryFn: async () => {
            const { data } = await api.get(`/branches?tenantId=${user?.tenantId}`);
            return data;
        },
        enabled: isOpen && !!user?.tenantId,
    });

    const createMutation = useMutation({
        mutationFn: async (newUser: any) => {
            await api.post('/users', newUser);
        },
        onSuccess: () => {
            toast.success('Usuario registrado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
            setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al registrar usuario');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedUser: any) => {
            const payload = { ...updatedUser };
            if (!payload.password) delete payload.password; // Don't send empty password flag
            await api.patch(`/users/${initialData?.id}`, payload);
        },
        onSuccess: () => {
            toast.success('Usuario actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar usuario');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            tenantId: user?.tenantId,
            branchId: formData.branchId || branches[0]?.id || null, // default to first branch if empty
        };
        if (initialData) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Editar Empleado' : 'Registrar Empleado'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Juan Pérez"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            placeholder="juan@nexopos.cl"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required={!initialData}
                            placeholder={initialData ? "Dejar en blanco para conservar" : "••••••••"}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">El empleado usará esta contraseña para acceder al sistema.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                            <select
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="CASHIER">Cajero (Solo Ventas)</option>
                                <option value="MANAGER">Supervisor (Reportes, Stock)</option>
                                <option value="TENANT_ADMIN">Administrador (Total)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                            <select
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                                value={formData.branchId}
                                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                disabled={branches.length === 0}
                            >
                                <option value="" disabled>Seleccionar...</option>
                                {branches.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : initialData ? 'Actualizar Cambios' : 'Guardar Empleado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
