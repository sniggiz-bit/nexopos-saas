
import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { CustomerFormModal } from '../../components/dashboard/CustomerFormModal';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { Customer } from '../../api/types';


export function ClientsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    const { data: customers, isLoading } = useCustomers();
    const deleteCustomer = useDeleteCustomer();

    const filteredCustomers = customers?.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.rut.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleEdit = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (customer: Customer) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${customer.name}"?`)) {
            await deleteCustomer.mutateAsync(customer.id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCustomerToEdit(null);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RUT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setCustomerToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Cliente
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Cargando clientes...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron clientes</td></tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.rut}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.giro || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.email && <div>{customer.email}</div>}
                                            {customer.phone && <div>{customer.phone}</div>}
                                            {!customer.email && !customer.phone && '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-900 mr-3">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(customer)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <CustomerFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={customerToEdit}
                />
            </div>
        </DashboardLayout>
    );
}
