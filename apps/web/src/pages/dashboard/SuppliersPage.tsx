import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
} from '../../hooks/useSuppliers';
import type { Supplier } from '../../api/suppliers';
import {
    Plus,
    Edit,
    Trash2,
    Loader2,
    Truck,
    X,
    Phone,
    Mail,
    MapPin,
    Hash,
} from 'lucide-react';
import { formatRut } from '@nexopos/shared';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

interface SupplierForm {
    name: string;
    rut: string;
    email: string;
    phone: string;
    address: string;
}

const EMPTY_FORM: SupplierForm = {
    name: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
};

export function SuppliersPage() {
    const { data: suppliers, isLoading } = useSuppliers();
    const createSupplier = useCreateSupplier();
    const updateSupplier = useUpdateSupplier();
    const deleteSupplier = useDeleteSupplier();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSuppliers = (suppliers ?? []).filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rut ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenCreate = () => {
        setEditingSupplier(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setForm({
            name: supplier.name,
            rut: supplier.rut ?? '',
            email: supplier.email ?? '',
            phone: supplier.phone ?? '',
            address: supplier.address ?? '',
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setForm(EMPTY_FORM);
    };

    const handleChange = (field: keyof SupplierForm, value: string) => {
        if (field === 'rut') {
            const formatted = formatRut(value);
            setForm((prev) => ({ ...prev, [field]: formatted }));

            const clean = value.replace(/\./g, '').replace(/-/g, '');
            if (clean.length >= 8) {
                handleRutLookup(formatted);
            }
        } else {
            setForm((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleRutLookup = async (rut: string) => {
        try {
            const response = await apiClient.get(`/common/rut-lookup/${rut}`);
            if (response.data) {
                if (response.data.success && response.data.data) {
                    const { reasonSocial, address } = response.data.data;
                    setForm(prev => ({
                        ...prev,
                        name: reasonSocial || prev.name || '',
                        address: address || prev.address || '',
                    }));
                    toast.success('Datos de proveedor completados automáticamente');
                } else {
                    const errorMsg = response.data.error || response.data.message || 'Error al consultar datos';
                    if (errorMsg.includes('disponibles') || errorMsg.includes('403') || errorMsg.includes('agotado') || errorMsg.includes('límite') || errorMsg.includes('limite')) {
                        toast.error('Límite de consultas de RUT agotado. Ingresa los datos manualmente.');
                    } else {
                        toast.error(`No se pudo autocompletar: ${errorMsg}`);
                    }
                }
            }
        } catch (error: any) {
            console.error('RUT Lookup error:', error);
            const msg = error.response?.data?.message || error.message || 'Error en el servidor';
            toast.error(`Error en servidor al consultar RUT: ${msg}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.name,
            ...(form.rut ? { rut: form.rut } : {}),
            ...(form.email ? { email: form.email } : {}),
            ...(form.phone ? { phone: form.phone } : {}),
            ...(form.address ? { address: form.address } : {}),
        };
        if (editingSupplier) {
            await updateSupplier.mutateAsync({ id: editingSupplier.id, data: payload });
        } else {
            await createSupplier.mutateAsync(payload);
        }
        handleClose();
    };

    const handleDelete = async (supplier: Supplier) => {
        if (window.confirm(`¿Eliminar al proveedor "${supplier.name}"? Esta acción no se puede deshacer.`)) {
            await deleteSupplier.mutateAsync(supplier.id);
        }
    };

    const isSaving = createSupplier.isPending || updateSupplier.isPending;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-gray-400 text-sm mt-1">
                            Gestiona los proveedores de tu negocio para registrar compras y controlar el stock.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Buscar proveedor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg text-sm focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none w-56"
                        />
                        <button
                            onClick={handleOpenCreate}
                            className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all rounded-lg flex items-center gap-2 shadow-sm whitespace-nowrap font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Proveedor
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-[rgba(0,212,255,0.05)]">
                        <thead className="bg-[rgba(0,212,255,0.02)]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Proveedor
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    RUT
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Teléfono
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(0,212,255,0.05)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF] mx-auto" />
                                        <p className="mt-2 text-gray-400 text-sm">Cargando proveedores...</p>
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <Truck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">
                                            {searchQuery ? 'No se encontraron proveedores.' : 'Aún no hay proveedores registrados.'}
                                        </p>
                                        {!searchQuery && (
                                            <button
                                                onClick={handleOpenCreate}
                                                className="mt-3 text-[#00D4FF] hover:underline text-sm font-medium"
                                            >
                                                + Agregar el primero
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-[rgba(0,212,255,0.02)] transition-colors border-b border-[rgba(0,212,255,0.05)]">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-[#00D4FF] flex items-center justify-center font-bold text-xs shrink-0">
                                                    {supplier.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{supplier.name}</p>
                                                    {supplier.address && (
                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3 text-gray-500" />
                                                            {supplier.address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {supplier.rut ? (
                                                <span className="flex items-center gap-1.5 font-mono">
                                                    <Hash className="w-3.5 h-3.5 text-gray-500" />
                                                    {supplier.rut}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {supplier.phone ? (
                                                <span className="flex items-center gap-1.5 font-mono">
                                                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                                                    {supplier.phone}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {supplier.email ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                                                    {supplier.email}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenEdit(supplier)}
                                                title="Editar"
                                                className="text-[#00D4FF] hover:text-[#00BCE0] mr-2 p-1.5 hover:bg-[rgba(0,212,255,0.06)] rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier)}
                                                title="Eliminar"
                                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Counter */}
                {!isLoading && suppliers && suppliers.length > 0 && (
                    <p className="text-xs text-gray-500 text-right">
                        {filteredSuppliers.length} de {suppliers.length} proveedor(es)
                    </p>
                )}
            </div>

            {/* ─── Modal Crear / Editar ─── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[rgba(15,22,36,0.95)] border border-[rgba(0,212,255,0.15)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-[rgba(0,212,255,0.08)] flex justify-between items-center bg-[rgba(0,212,255,0.02)]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg flex items-center justify-center text-[#00D4FF]">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                </h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-full p-1.5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1">
                                    Nombre del Proveedor <span className="text-red-500">*</span>
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Ej: Distribuidora Los Andes S.A."
                                    className="w-full px-4 py-2.5 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all text-sm"
                                />
                            </div>

                            {/* RUT + Phone side-by-side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-1">
                                        RUT
                                    </label>
                                    <input
                                        type="text"
                                        value={form.rut}
                                        onChange={(e) => handleChange('rut', e.target.value)}
                                        placeholder="Ej: 76.543.210-9"
                                        className="w-full px-4 py-2.5 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="Ej: +56 9 1234 5678"
                                        className="w-full px-4 py-2.5 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all text-sm font-mono"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="Ej: ventas@proveedor.cl"
                                    className="w-full px-4 py-2.5 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="Ej: Av. Providencia 1234, Santiago"
                                    className="w-full px-4 py-2.5 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2.5 text-gray-400 hover:bg-[rgba(255,255,255,0.05)] hover:text-white rounded-lg font-medium transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all rounded-lg font-semibold flex items-center gap-2 text-sm"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
