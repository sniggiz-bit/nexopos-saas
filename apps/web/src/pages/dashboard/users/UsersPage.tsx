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
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Administrador</span>;
            case 'MANAGER':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Supervisor</span>;
            case 'CASHIER':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">Cajero</span>;
            case 'SUPER_ADMIN':
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Soporte Nexo</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{role}</span>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Personal y Usuarios</h1>
                        <p className="text-sm text-gray-500 mt-1">Gestiona los accesos y roles de tu equipo.</p>
                    </div>
                    <button
                        onClick={() => {
                            setUserToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Registrar Empleado
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Cargando personal...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <UserCircle size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No hay usuarios</h3>
                            <p className="text-gray-500 text-sm mt-1">No se encontraron empleados registrados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-600">Empleado</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-600">Rol</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-600">Sucursal</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-600">Registro</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                        {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{u.name || 'Sin nombre'}</div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Mail size={12} /> {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={14} className="text-gray-400" />
                                                    {getRoleBadge(u.role)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={14} className="text-gray-400" />
                                                    {u.branch?.name || 'Todas (Global)'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
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
                                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-4"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('¿Seguro que deseas eliminar este usuario?')) {
                                                                    deleteMutation.mutate(u.id);
                                                                }
                                                            }}
                                                            className="text-sm text-red-600 hover:text-red-700 font-medium"
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
