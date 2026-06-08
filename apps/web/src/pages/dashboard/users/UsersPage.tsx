import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Plus, Search, Shield, Building2, Mail, UserCircle } from 'lucide-react';
import { UserFormModal } from './components/UserFormModal';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    branch: { name: string } | null;
    createdAt: string;
}

export function UsersPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ['users', user?.tenantId],
        queryFn: async () => {
            const { data } = await api.get(`/users?tenantId=${user?.tenantId}`);
            return data;
        },
        enabled: !!user?.tenantId,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            toast.success('Usuario eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            toast.error('Error al eliminar usuario');
        }
    });

    const filteredUsers = users.filter((u) =>
        u.role !== 'SUPER_ADMIN' &&
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'TENANT_ADMIN':
                return <span className="px-2 py-1 bg-[rgba(239,68,68,0.06)] text-red-400 border border-[rgba(239,68,68,0.15)] rounded-md text-xs font-semibold">Administrador</span>;
            case 'MANAGER':
                return <span className="px-2 py-1 bg-[rgba(0,212,255,0.06)] text-[#00D4FF] border border-[rgba(0,212,255,0.15)] rounded-md text-xs font-semibold">Supervisor</span>;
            case 'CASHIER':
                return <span className="px-2 py-1 bg-[rgba(16,185,129,0.06)] text-[#10B981] border border-[rgba(16,185,129,0.15)] rounded-md text-xs font-semibold">Cajero</span>;
            case 'SUPER_ADMIN':
                return <span className="px-2 py-1 bg-[rgba(168,85,247,0.06)] text-purple-400 border border-[rgba(168,85,247,0.15)] rounded-md text-xs font-semibold">Soporte Nexo</span>;
            default:
                return <span className="px-2 py-1 bg-[rgba(156,163,175,0.06)] text-gray-400 border border-[rgba(156,163,175,0.15)] rounded-md text-xs font-semibold">{role}</span>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Personal y Usuarios</h1>
                        <p className="text-sm text-gray-400 mt-1">Gestiona los accesos y roles de tu equipo.</p>
                    </div>
                    <button
                        onClick={() => {
                            setUserToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all rounded-lg font-semibold shadow-sm"
                    >
                        <Plus size={20} />
                        Registrar Empleado
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="w-full pl-10 pr-4 py-2 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-xl overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Cargando personal...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <UserCircle size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-white">No hay usuarios</h3>
                            <p className="text-gray-400 text-sm mt-1">No se encontraron empleados registrados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(0,212,255,0.02)] border-b border-[rgba(0,212,255,0.08)]">
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empleado</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sucursal</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registro</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(0,212,255,0.05)]">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-[rgba(0,212,255,0.02)] transition-colors border-b border-[rgba(0,212,255,0.05)]">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-[#00D4FF] flex items-center justify-center font-bold">
                                                        {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{u.name || 'Sin nombre'}</div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-400">
                                                            <Mail size={12} className="text-gray-500" /> {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={14} className="text-gray-500" />
                                                    {getRoleBadge(u.role)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={14} className="text-gray-500" />
                                                    {u.branch?.name || 'Todas (Global)'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {user?.id !== u.id && u.role !== 'SUPER_ADMIN' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setUserToEdit(u);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="text-sm text-[#00D4FF] hover:text-[#00BCE0] font-semibold mr-4 transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('¿Seguro que deseas eliminar este usuario?')) {
                                                                    deleteMutation.mutate(u.id);
                                                                }
                                                            }}
                                                            className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setUserToEdit(null);
                    }}
                    initialData={userToEdit}
                />
            </div>
        </DashboardLayout>
    );
}
