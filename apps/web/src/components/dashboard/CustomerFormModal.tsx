
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateCustomer } from '../../hooks/useCustomers';
import { useUpdateCustomer } from '../../hooks/useCustomers';
import toast from 'react-hot-toast';
import type { Customer } from '../../api/types';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Customer | null;
}

export function CustomerFormModal({ isOpen, onClose, initialData }: CustomerFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        rut: '',
        giro: '',
        address: '',
        comuna: '',
        email: '',
        phone: '',
    });

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({
                name: initialData.name,
                rut: initialData.rut,
                giro: initialData.giro || '',
                address: initialData.address || '',
                comuna: initialData.comuna || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
            });
        } else if (!initialData && isOpen) {
            setFormData({
                name: '',
                rut: '',
                giro: '',
                address: '',
                comuna: '',
                email: '',
                phone: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.rut) {
            toast.error('Nombre y RUT son obligatorios');
            return;
        }

        try {
            if (initialData) {
                await updateCustomer.mutateAsync({
                    id: initialData.id,
                    data: {
                        name: formData.name,
                        rut: formData.rut,
                        giro: formData.giro || undefined,
                        address: formData.address || undefined,
                        comuna: formData.comuna || undefined,
                        email: formData.email || undefined,
                        phone: formData.phone || undefined,
                    }
                });
                toast.success('Cliente actualizado exitosamente');
                onClose();
            } else {
                await createCustomer.mutateAsync({
                    name: formData.name,
                    rut: formData.rut,
                    giro: formData.giro || undefined,
                    address: formData.address || undefined,
                    comuna: formData.comuna || undefined,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    tenantId: 'tenant-1',
                });
                toast.success('Cliente creado exitosamente');
                onClose();
            }
        } catch (error: any) {
            const action = initialData ? 'actualizar' : 'crear';
            toast.error(error.response?.data?.message || `Error al ${action} cliente`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                        <input
                            type="text"
                            value={formData.rut}
                            onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="12.345.678-9"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giro</label>
                        <input
                            type="text"
                            value={formData.giro}
                            onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                            <input
                                type="text"
                                value={formData.comuna}
                                onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Cancelar
                        </button>
                        <button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {createCustomer.isPending || updateCustomer.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
