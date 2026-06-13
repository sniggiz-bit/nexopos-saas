import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateCustomer } from '../../hooks/useCustomers';
import { useUpdateCustomer } from '../../hooks/useCustomers';
import toast from 'react-hot-toast';
import type { Customer } from '../../api/types';
import { formatRut, validateRut } from '@nexopos/shared';
import { apiClient } from '../../api/client';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Customer | null;
}

// ── Palette (Alineado con el Tema Oscuro del Dashboard) ─────────────────────────
const C = {
    bg:      'rgba(8,12,24,0.98)',
    surface: 'rgba(16,24,44,0.95)',
    card:    'rgba(20,30,58,0.8)',
    border:  'rgba(0,212,255,0.12)',
    borderH: 'rgba(0,212,255,0.28)',
    cyan:    '#00D4FF',
    cyanA:   (a: number) => `rgba(0,212,255,${a})`,
    text:    'rgba(210,225,245,0.92)',
    muted:   'rgba(180,195,220,0.5)',
    subtle:  'rgba(180,195,220,0.2)',
    green:   '#34D399',
    greenA:  (a: number) => `rgba(52,211,153,${a})`,
    red:     '#F87171',
    redA:    (a: number) => `rgba(248,113,113,${a})`,
};

const inputCls = `
    w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-150
`.trim();

const inputStyle = (focused: boolean = false): React.CSSProperties => ({
    background: focused ? C.cyanA(0.07) : C.cyanA(0.04),
    border: `1px solid ${focused ? C.borderH : C.border}`,
    color: C.text,
    fontSize: '13px',
    borderRadius: '8px',
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
    transition: 'all 0.15s',
});

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: C.muted,
    marginBottom: '6px',
};

// ── Input Enfocable ──────────────────────────────────────────────────────────
function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            {...props}
            className={inputCls}
            style={{
                ...inputStyle(focused),
                ...props.style,
            }}
            onFocus={e => { setFocused(true); props.onFocus?.(e); }}
            onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
        />
    );
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
    const [loadingRut, setLoadingRut] = useState(false);

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    const handleRutLookup = async (rut: string) => {
        setLoadingRut(true);
        try {
            // Se utiliza apiClient para anteponer /api de forma automática y usar cabeceras de auth
            const response = await apiClient.get(`/common/rut-lookup/${rut}`);
            if (response.data) {
                if (response.data.success && response.data.data) {
                    const { reasonSocial, giro, address, comuna } = response.data.data;
                    setFormData(prev => ({
                        ...prev,
                        name: reasonSocial || prev.name || '',
                        giro: giro || prev.giro || '',
                        address: address || prev.address || '',
                        comuna: comuna || prev.comuna || '',
                    }));
                    toast.success('Datos tributarios completados de forma automática');
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
        } finally {
            setLoadingRut(false);
        }
    };

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

        if (!validateRut(formData.rut)) {
            toast.error('El RUT ingresado no es válido. Verifica el dígito verificador.');
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
                });
                toast.success('Cliente creado exitosamente');
                onClose();
            }
        } catch (error: any) {
            const action = initialData ? 'actualizar' : 'crear';
            const msg = error.response?.data?.message;
            const errorText = Array.isArray(msg) ? msg[0] : (msg || `Error al ${action} cliente`);
            toast.error(errorText);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 55, padding: '16px',
        }}>
            {/* Ambient Glow */}
            <div style={{
                position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                background: C.cyanA(0.03), filter: 'blur(80px)',
                pointerEvents: 'none',
            }} />

            <div style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: `0 0 60px ${C.cyanA(0.06)}, 0 32px 64px rgba(0,0,0,0.6)`,
                position: 'relative',
                scrollbarWidth: 'thin',
                scrollbarColor: `${C.cyanA(0.15)} transparent`,
            }}>

                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    position: 'sticky', top: 0, zIndex: 10,
                    background: C.bg,
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: C.text }}>
                            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.muted }}>
                            {initialData ? 'Modifica los datos tributarios del cliente' : 'Completa los datos para facturación electrónica'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: '8px',
                            background: C.cyanA(0.06), border: `1px solid ${C.border}`,
                            color: C.muted, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redA(0.12); (e.currentTarget as HTMLElement).style.color = C.red; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.cyanA(0.06); (e.currentTarget as HTMLElement).style.color = C.muted; }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* RUT con Autocompletación */}
                    <div>
                        <label style={labelStyle}>RUT *</label>
                        <div style={{ position: 'relative' }}>
                            <FocusInput
                                type="text"
                                value={formData.rut}
                                onChange={(e) => {
                                    const formatted = formatRut(e.target.value);
                                    setFormData({ ...formData, rut: formatted });
                                    // Se realiza la consulta del RUT solo cuando pasa la validación matemática
                                    if (validateRut(formatted)) {
                                        handleRutLookup(formatted);
                                    }
                                }}
                                style={{
                                    borderColor: formData.rut && formData.rut.includes('-')
                                        ? validateRut(formData.rut)
                                            ? C.green
                                            : C.red
                                        : C.border,
                                    paddingRight: loadingRut ? '38px' : '12px'
                                }}
                                placeholder="12.345.678-9"
                                required
                            />
                            {loadingRut && (
                                <div style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)', display: 'flex', alignItems: 'center'
                                }}>
                                    <Loader2 style={{ width: '16px', height: '16px', color: C.cyan, animation: 'spin 1s linear infinite' }} />
                                </div>
                            )}
                        </div>
                        {formData.rut && formData.rut.includes('-') && !validateRut(formData.rut) && (
                            <p style={{ marginTop: 4, fontSize: '11px', color: C.red }}>RUT inválido — verifica el dígito verificador</p>
                        )}
                    </div>

                    {/* Nombre o Razón Social */}
                    <div>
                        <label style={labelStyle}>Nombre / Razón Social *</label>
                        <FocusInput
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nombre completo o Razón Social"
                            required
                        />
                    </div>

                    {/* Giro Comercial */}
                    <div>
                        <label style={labelStyle}>Giro Comercial</label>
                        <FocusInput
                            type="text"
                            value={formData.giro}
                            onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                            placeholder="Giro o actividad económica"
                        />
                    </div>

                    {/* Dirección y Comuna */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Dirección</label>
                            <FocusInput
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Dirección comercial"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Comuna</label>
                            <FocusInput
                                type="text"
                                value={formData.comuna}
                                onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                                placeholder="Comuna"
                            />
                        </div>
                    </div>

                    {/* Email y Teléfono */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <FocusInput
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="cliente@correo.com"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Teléfono</label>
                            <FocusInput
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+56 9 1234 5678"
                            />
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', gap: 10,
                        paddingTop: 16, borderTop: `1px solid ${C.border}`,
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                                background: C.cyanA(0.05), border: `1px solid ${C.border}`,
                                color: C.muted, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.1)}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.05)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createCustomer.isPending || updateCustomer.isPending}
                            style={{
                                padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: 800,
                                background: 'linear-gradient(135deg, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.12) 100%)',
                                border: `1px solid ${C.cyanA(0.4)}`,
                                color: C.cyan, cursor: 'pointer', transition: 'all 0.15s',
                                boxShadow: `0 0 20px ${C.cyanA(0.12)}`,
                                opacity: (createCustomer.isPending || updateCustomer.isPending) ? 0.6 : 1,
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,212,255,0.35) 0%, rgba(0,212,255,0.2) 100%)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.12) 100%)'}
                        >
                            {createCustomer.isPending || updateCustomer.isPending
                                ? 'Guardando...'
                                : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* CSS spin animation */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
