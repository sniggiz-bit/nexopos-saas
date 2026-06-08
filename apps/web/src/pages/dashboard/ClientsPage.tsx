import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { CustomerFormModal } from '../../components/dashboard/CustomerFormModal';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import type { Customer } from '../../api/types';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    cyan:  '#00D4FF',
    cyanA: (a: number) => `rgba(0,212,255,${a})`,
    red:   '#F87171',
    redA:  (a: number) => `rgba(248,113,113,${a})`,
    text:  'rgba(210,225,245,0.9)',
    muted: 'rgba(180,195,220,0.45)',
    subtle:'rgba(180,195,220,0.25)',
};

const inputStyle: React.CSSProperties = {
    background:   'rgba(0,212,255,0.04)',
    border:       '1px solid rgba(0,212,255,0.12)',
    borderRadius: '10px',
    padding:      '7px 12px 7px 36px',
    fontSize:     '13px',
    color:        'rgba(210,225,245,0.85)',
    outline:      'none',
    width:        '100%',
};

const COLS = ['Nombre', 'RUT', 'Giro', 'Contacto', 'Acciones'];

export function ClientsPage() {
    const [searchTerm,       setSearchTerm]       = useState('');
    const [isModalOpen,      setIsModalOpen]       = useState(false);
    const [customerToEdit,   setCustomerToEdit]   = useState<Customer | null>(null);

    const { data: customers, isLoading } = useCustomers();
    const deleteCustomer = useDeleteCustomer();

    const filtered = customers?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rut.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleEdit  = (c: Customer) => { setCustomerToEdit(c); setIsModalOpen(true); };
    const handleClose = () => { setIsModalOpen(false); setCustomerToEdit(null); };
    const handleDelete = async (c: Customer) => {
        if (window.confirm(`¿Eliminar al cliente "${c.name}"?`)) await deleteCustomer.mutateAsync(c.id);
    };

    return (
        <DashboardLayout>
            <div className="space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color: C.cyanA(0.4) }} />
                        <input
                            type="text" placeholder="Buscar por nombre o RUT..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={inputStyle}
                            onFocus={e  => (e.currentTarget.style.borderColor = C.cyanA(0.4))}
                            onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)')} />
                    </div>
                    <button
                        onClick={() => { setCustomerToEdit(null); setIsModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-150 shrink-0"
                        style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.2) 0%,rgba(0,212,255,0.08) 100%)', border: `1px solid ${C.cyanA(0.3)}`, color: C.cyan }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,rgba(0,212,255,0.28) 0%,rgba(0,212,255,0.14) 100%)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,rgba(0,212,255,0.2) 0%,rgba(0,212,255,0.08) 100%)'}>
                        <Plus className="w-4 h-4" style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }} />
                        Nuevo Cliente
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cyanA(0.1)}` }}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-[13px]">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.07)' }}>
                                    {COLS.map(col => (
                                        <th key={col}
                                            className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${col === 'Acciones' ? 'text-right' : 'text-left'}`}
                                            style={{ color: C.cyanA(0.4), background: C.cyanA(0.03) }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse" style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
                                            {COLS.map(c => (
                                                <td key={c} className="px-5 py-4">
                                                    <div className="h-3.5 rounded-lg" style={{ background: C.cyanA(0.06), width: '70%' }} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLS.length}>
                                            <div className="py-16 flex flex-col items-center gap-3">
                                                <Users className="w-10 h-10" style={{ color: C.cyanA(0.2) }} />
                                                <p className="text-sm font-semibold" style={{ color: C.subtle }}>
                                                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((customer, idx) => {
                                        const isEven = idx % 2 === 0;
                                        return (
                                            <tr key={customer.id}
                                                style={{ borderBottom: '1px solid rgba(0,212,255,0.05)', background: isEven ? 'transparent' : C.cyanA(0.015) }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.04)}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isEven ? 'transparent' : C.cyanA(0.015)}>

                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                                                            style={{ background: C.cyanA(0.1), color: C.cyan, border: `1px solid ${C.cyanA(0.2)}` }}>
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold" style={{ color: C.text }}>{customer.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[12px]" style={{ color: C.muted }}>{customer.rut}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: C.muted }}>
                                                    {customer.giro || <span style={{ color: C.subtle }}>—</span>}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: C.muted }}>
                                                    <div className="flex flex-col gap-0.5">
                                                        {customer.email && <span className="text-[12px]">{customer.email}</span>}
                                                        {customer.phone && <span className="text-[12px]">{customer.phone}</span>}
                                                        {!customer.email && !customer.phone && <span style={{ color: C.subtle }}>—</span>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <ActionBtn onClick={() => handleEdit(customer)} color={C.cyan} alphaFn={C.cyanA} title="Editar">
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </ActionBtn>
                                                        <ActionBtn onClick={() => handleDelete(customer)} color={C.red} alphaFn={C.redA} title="Eliminar">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </ActionBtn>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > 0 && !isLoading && (
                        <div className="px-5 py-2.5 text-[11px] text-right"
                            style={{ borderTop: '1px solid rgba(0,212,255,0.07)', color: C.cyanA(0.35) }}>
                            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                <CustomerFormModal isOpen={isModalOpen} onClose={handleClose} initialData={customerToEdit} />
            </div>
        </DashboardLayout>
    );
}

// ── Reusable action button ─────────────────────────────────────────────────────
function ActionBtn({ onClick, color, alphaFn, title, children }: {
    onClick: () => void; color: string; alphaFn: (a: number) => string;
    title: string; children: React.ReactNode;
}) {
    return (
        <button onClick={onClick} title={title}
            className="p-2 rounded-lg transition-all duration-150"
            style={{ background: alphaFn(0.08), border: `1px solid ${alphaFn(0.2)}`, color }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = alphaFn(0.18)}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = alphaFn(0.08)}>
            {children}
        </button>
    );
}
