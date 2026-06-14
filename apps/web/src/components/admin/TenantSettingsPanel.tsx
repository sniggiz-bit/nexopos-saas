import { useState } from 'react';
import { Save, Loader2, Cpu, Users, Building2, ShieldAlert } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface TenantSettings {
    // DTE Modules
    enableBoletaDte: boolean;
    enableFacturaDte: boolean;
    enableGuiaDespachoDte: boolean;
    enableNotaCreditoDte: boolean;
    // Resource Limits
    maxBranches: number;
    maxRegisters: number;
    maxUsers: number;
    // Special Permissions
    canHardDelete: boolean;
}

interface TenantSettingsPanelProps {
    tenantId: string;
    settings: TenantSettings | null;
    onSaved?: (updated: TenantSettings) => void;
}

// --- Primitives -----------------------------------------------------------

function ToggleSwitch({
    checked,
    onChange,
    danger = false,
    disabled = false,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    danger?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-50
                ${checked
                    ? danger
                        ? 'bg-red-500 focus:ring-red-500'
                        : 'bg-purple-500 focus:ring-purple-500'
                    : 'bg-neutral-600 focus:ring-neutral-500'
                }`}
            aria-checked={checked}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Icon size={18} className="text-purple-400" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-neutral-500">{subtitle}</p>
            </div>
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange, danger }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    danger?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-neutral-700/50 last:border-0">
            <div className="flex-1 mr-4">
                <p className={`text-sm font-medium ${danger ? 'text-red-300' : 'text-neutral-200'}`}>{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </div>
            <ToggleSwitch checked={checked} onChange={onChange} danger={danger} />
        </div>
    );
}

function NumberInput({ label, description, value, onChange, min = 1 }: {
    label: string;
    description: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-neutral-700/50 last:border-0">
            <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-neutral-200">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </div>
            <input
                type="number"
                min={min}
                value={value}
                onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))}
                className="w-20 bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors"
            />
        </div>
    );
}

// --- Main Panel -----------------------------------------------------------

export default function TenantSettingsPanel({ tenantId, settings: initialSettings, onSaved }: TenantSettingsPanelProps) {
    const defaultSettings: TenantSettings = {
        enableBoletaDte: false,
        enableFacturaDte: false,
        enableGuiaDespachoDte: false,
        enableNotaCreditoDte: false,
        maxBranches: 1,
        maxRegisters: 1,
        maxUsers: 3,
        canHardDelete: false,
    };

    const [form, setForm] = useState<TenantSettings>(initialSettings ?? defaultSettings);
    const [saving, setSaving] = useState(false);

    const patch = <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.patch(`/tenants/${tenantId}/settings`, form);
            onSaved?.(res.data);
            toast.success('Configuración guardada correctamente.');
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Error al guardar la configuración.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!initialSettings && !form) {
        return (
            <div className="flex items-center justify-center py-12 text-neutral-500">
                <Loader2 className="animate-spin mr-2" size={18} />
                <span>Cargando configuración…</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* DTE Modules */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <SectionHeader
                    icon={Cpu}
                    title="Módulos DTE (SII)"
                    subtitle="Activa los documentos tributarios electrónicos habilitados para este cliente"
                />
                <div>
                    <ToggleRow
                        label="Boleta Electrónica"
                        description="Permite emitir boletas electrónicas vía SII"
                        checked={form.enableBoletaDte}
                        onChange={(v) => patch('enableBoletaDte', v)}
                    />
                    <ToggleRow
                        label="Factura Electrónica"
                        description="Permite emitir facturas con validez tributaria"
                        checked={form.enableFacturaDte}
                        onChange={(v) => patch('enableFacturaDte', v)}
                    />
                    <ToggleRow
                        label="Guía de Despacho"
                        description="Permite emitir guías de despacho electrónicas"
                        checked={form.enableGuiaDespachoDte}
                        onChange={(v) => patch('enableGuiaDespachoDte', v)}
                    />
                    <ToggleRow
                        label="Nota de Crédito"
                        description="Permite emitir notas de crédito electrónicas"
                        checked={form.enableNotaCreditoDte}
                        onChange={(v) => patch('enableNotaCreditoDte', v)}
                    />
                </div>
            </div>

            {/* Resource Limits */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <SectionHeader
                    icon={Building2}
                    title="Límites de Recursos"
                    subtitle="Máximo de entidades permitidas según el plan contratado"
                />
                <div>
                    <NumberInput
                        label="Sucursales máximas"
                        description="Cuántas sucursales puede tener este tenant"
                        value={form.maxBranches}
                        onChange={(v) => patch('maxBranches', v)}
                    />
                    <NumberInput
                        label="Cajas (Registros) máximas"
                        description="Cuántas cajas registradoras por sucursal"
                        value={form.maxRegisters}
                        onChange={(v) => patch('maxRegisters', v)}
                    />
                    <NumberInput
                        label="Usuarios máximos"
                        description="Total de usuarios en el sistema del tenant"
                        value={form.maxUsers}
                        onChange={(v) => patch('maxUsers', v)}
                    />
                </div>
            </div>

            {/* Special Permissions */}
            <div className="bg-neutral-800 border border-red-900/40 rounded-xl p-5">
                <SectionHeader
                    icon={ShieldAlert}
                    title="Permisos Especiales"
                    subtitle="Acciones de alto riesgo — habilitar con cuidado"
                />
                <div>
                    <ToggleRow
                        label="Eliminación permanente (Hard Delete)"
                        description="Permite al admin del tenant eliminar registros de forma definitiva e irrecuperable"
                        checked={form.canHardDelete}
                        onChange={(v) => patch('canHardDelete', v)}
                        danger
                    />
                </div>
            </div>

            {/* Users current count indicator */}
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                    <Users size={14} />
                    <span>Los cambios de límites se aplican de forma inmediata pero no afectan registros existentes.</span>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                >
                    {saving ? (
                        <><Loader2 size={16} className="animate-spin" /> Guardando…</>
                    ) : (
                        <><Save size={16} /> Guardar Configuración</>
                    )}
                </button>
            </div>
        </div>
    );
}
