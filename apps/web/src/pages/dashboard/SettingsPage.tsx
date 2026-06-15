import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import {
    Save, Upload, X, Loader2, FileText,
    CheckCircle2, Calendar, ExternalLink, RefreshCw,
    Hash, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDteConfig, upsertDteConfig } from '@/api/dte-config';
import { api } from '@/lib/api';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    cyan:   '#0099CC',
    cyanA:  (a: number) => `rgba(0,153,204,${a})`,
    green:  '#34D399',
    greenA: (a: number) => `rgba(52,211,153,${a})`,
    red:    '#F87171',
    redA:   (a: number) => `rgba(248,113,113,${a})`,
    amber:  '#F59E0B',
    amberA: (a: number) => `rgba(245,158,11,${a})`,
    violet: '#A78BFA',
    violetA:(a: number) => `rgba(167,139,250,${a})`,
    text: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted-foreground))',
    subtle: 'hsl(var(--muted-foreground))',
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface DteStats {
    totalAccepted: number;
    thisMonth:     number;
    errorCount:    number;
    byType:    { type: number; label: string; count: number; lastFolio: number | null }[];
    recentDocs: {
        id: string; folio: number; type: number; label: string;
        pdfUrl: string | null; total: number; createdAt: string; customerName: string | null;
    }[];
}

const DTE_TYPE: Record<number, { color: string; alpha: (a: number) => string }> = {
    39: { color: C.cyan,   alpha: C.cyanA   },
    33: { color: C.green,  alpha: C.greenA  },
    61: { color: C.amber,  alpha: C.amberA  },
    52: { color: C.violet, alpha: C.violetA },
};

const fmtPrice = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
const fmtDate  = (s: string) =>
    new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

// ── Shared input style ─────────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
    background:   C.cyanA(0.04),
    border:       `1px solid ${C.cyanA(0.14)}`,
    borderRadius: '10px',
    padding:      '9px 14px',
    fontSize:     '13px',
    color:        C.text,
    outline:      'none',
    width:        '100%',
    transition:   'border-color 150ms',
    colorScheme: 'normal',
};

// ── Stats Panel ────────────────────────────────────────────────────────────────
function DteStatsPanel({ tenantId }: { tenantId: string }) {
    const { data, isLoading, refetch, isRefetching } = useQuery<DteStats>({
        queryKey: ['dte-stats', tenantId],
        queryFn:  async () => { const res = await apiClient.get('/dte-config/stats'); return res.data; },
        enabled: !!tenantId,
        staleTime: 60_000,
    });

    const { data: folios, isLoading: isLoadingFolios } = useQuery<
        { tipodoc: number; label: string; disponibles: number; ultimoFolio: number }[]
    >({
        queryKey: ['dte-folios', tenantId],
        queryFn: async () => {
            const res = await apiClient.get('/dte-config/folios');
            return res.data;
        },
        enabled: !!tenantId,
        staleTime: 60_000,
    });

    if (isLoading || isLoadingFolios) return (
        <div className="flex items-center gap-2 py-8 justify-center text-[13px]" style={{ color: C.muted }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.cyan }} /> Cargando estadísticas...
        </div>
    );
    if (!data) return null;

    return (
        <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: FileText,      label: 'Total emitidos', value: data.totalAccepted, sub: 'documentos aceptados', color: C.cyan,  alpha: C.cyanA  },
                    { icon: Calendar,      label: 'Este mes',       value: data.thisMonth,     sub: 'documentos',           color: C.violet,alpha: C.violetA },
                    {
                        icon: AlertTriangle,
                        label: 'Con error',
                        value: data.errorCount,
                        sub: data.errorCount > 0 ? 'requieren revisión' : 'sin errores',
                        color: data.errorCount > 0 ? C.red   : C.green,
                        alpha: data.errorCount > 0 ? C.redA  : C.greenA,
                    },
                ].map(({ icon: Icon, label, value, sub, color, alpha }) => (
                    <div key={label} className="rounded-xl p-4 flex items-center gap-3 relative overflow-hidden transition-all duration-200"
                        style={{ background: alpha(0.05), border: `1px solid ${alpha(0.15)}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = alpha(0.3)}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = alpha(0.15)}>
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                            style={{ background: `radial-gradient(circle, ${alpha(0.1)} 0%, transparent 70%)` }} />
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: alpha(0.12), border: `1px solid ${alpha(0.2)}` }}>
                            <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${alpha(0.7)})` }} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: alpha(0.55) }}>{label}</p>
                            <p className="text-xl font-black tabular-nums" style={{ color: C.text }}>{value}</p>
                            {sub && <p className="text-[10px]" style={{ color: C.muted }}>{sub}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Folios y Autorizaciones (CAF) */}
            {folios && folios.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: C.cyanA(0.03), border: `1px solid ${C.cyanA(0.08)}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.cyanA(0.4) }}>
                        Folios Disponibles en Lioren (CAF)
                    </p>
                    <div className="space-y-2">
                        {folios.map(f => {
                            const tc = DTE_TYPE[f.tipodoc] ?? { color: C.muted, alpha: (a: number) => `rgba(180,195,220,${a})` };
                            const isLow = f.disponibles < 50;
                            return (
                                <div key={f.tipodoc} className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.04)}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: tc.alpha(0.12), color: tc.color, border: `1px solid ${tc.alpha(0.25)}` }}>
                                            {f.tipodoc}
                                        </span>
                                        <span className="text-[13px]" style={{ color: C.text }}>{f.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] flex items-center gap-1" style={{ color: C.muted }}>
                                            <Hash className="w-3.5 h-3.5" />último folio: {f.ultimoFolio}
                                        </span>
                                        <span className={`text-[13px] font-bold tabular-nums flex items-center gap-1.5 ${isLow ? 'text-amber-500' : 'text-emerald-400'}`}>
                                            {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                                            {f.disponibles} disp.
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Por tipo */}
            {data.byType.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: C.cyanA(0.03), border: `1px solid ${C.cyanA(0.08)}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.cyanA(0.4) }}>
                        Por tipo de documento (Emitidos)
                    </p>
                    <div className="space-y-2">
                        {data.byType.map(t => {
                            const tc = DTE_TYPE[t.type] ?? { color: C.muted, alpha: (a: number) => `rgba(180,195,220,${a})` };
                            return (
                                <div key={t.type} className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.04)}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: tc.alpha(0.12), color: tc.color, border: `1px solid ${tc.alpha(0.25)}` }}>
                                            {t.type}
                                        </span>
                                        <span className="text-[13px]" style={{ color: C.text }}>{t.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[13px] font-bold tabular-nums" style={{ color: C.text }}>{t.count}</span>
                                        {t.lastFolio && (
                                            <span className="text-[10px] flex items-center gap-1" style={{ color: C.muted }}>
                                                <Hash className="w-3 h-3" />último: {t.lastFolio}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Documentos recientes */}
            {data.recentDocs.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.cyanA(0.08)}` }}>
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: `1px solid ${C.cyanA(0.07)}`, background: C.cyanA(0.03) }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.cyanA(0.4) }}>
                            Últimos documentos emitidos
                        </p>
                        <button onClick={() => refetch()} disabled={isRefetching}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: C.muted, background: C.cyanA(0.04) }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.cyan}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div>
                        {data.recentDocs.map((doc, idx) => {
                            const tc = DTE_TYPE[doc.type] ?? { color: C.muted, alpha: (a: number) => `rgba(180,195,220,${a})` };
                            const isEven = idx % 2 === 0;
                            return (
                                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 transition-colors"
                                    style={{ borderBottom: '1px solid rgba(0,153,204,0.05)', background: isEven ? 'transparent' : C.cyanA(0.015) }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.cyanA(0.04)}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isEven ? 'transparent' : C.cyanA(0.015)}>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                        style={{ background: tc.alpha(0.12), color: tc.color, border: `1px solid ${tc.alpha(0.25)}` }}>
                                        {doc.type}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[13px] font-semibold" style={{ color: C.text }}>
                                                Folio #{doc.folio}
                                            </span>
                                            <span className="text-[11px] truncate" style={{ color: C.muted }}>
                                                {doc.customerName ? `· ${doc.customerName}` : `· ${doc.label}`}
                                            </span>
                                        </div>
                                        <p className="text-[10px] mt-0.5" style={{ color: C.subtle }}>{fmtDate(doc.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[13px] font-bold tabular-nums" style={{ color: C.text }}>{fmtPrice(doc.total)}</span>
                                        {doc.pdfUrl && (
                                            <a href={doc.pdfUrl} target="_blank" rel="noreferrer" title="Ver PDF"
                                                className="p-1.5 rounded-lg transition-all"
                                                style={{ color: C.cyanA(0.5), background: C.cyanA(0.06) }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.cyan}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.cyanA(0.5)}>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {data.totalAccepted === 0 && data.errorCount === 0 && (
                <div className="text-center py-8 rounded-xl" style={{ border: `1px dashed ${C.cyanA(0.15)}` }}>
                    <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: C.cyanA(0.2) }} />
                    <p className="text-[13px]" style={{ color: C.muted }}>Sin documentos emitidos aún</p>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function SettingsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const tenantId    = user?.tenantId || '';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [liorenToken,     setLiorenToken]     = useState('');
    const [liorenLogo,      setLiorenLogo]      = useState('');
    const [dteResolution,   setDteResolution]   = useState('');
    const [resolutionDate,  setResolutionDate]  = useState('');
    const [uploadingLogo,   setUploadingLogo]   = useState(false);

    const { data: config, isLoading } = useQuery({
        queryKey: ['dte-config', tenantId],
        queryFn:  () => getDteConfig(tenantId),
        enabled:  !!tenantId,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (config) {
            setLiorenToken(config.liorenToken || '');
            setLiorenLogo(config.liorenLogo || '');
            setDteResolution(config.dteResolution || '');
            setResolutionDate(config.resolutionDate ? config.resolutionDate.split('T')[0] : '');
        }
    }, [config]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setUploadingLogo(true);
        try {
            const { data } = await api.post('/uploads/image', formData);
            setLiorenLogo(data.url);
            toast.success('Logo subido correctamente');
        } catch {
            toast.error('Error al subir el logo');
        } finally {
            setUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const { mutate: saveConfig, isPending } = useMutation({
        mutationFn: () => upsertDteConfig({ liorenToken, liorenLogo, dteResolution, resolutionDate }),
        onSuccess: () => {
            toast.success('Configuración guardada correctamente');
            queryClient.invalidateQueries({ queryKey: ['dte-config', tenantId] });
            queryClient.invalidateQueries({ queryKey: ['dte-folios', tenantId] });
            queryClient.invalidateQueries({ queryKey: ['dte-stats', tenantId] });
        },
        onError: () => toast.error('Error al guardar la configuración'),
    });

    const focusField  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
        (e.currentTarget.style.borderColor = C.cyanA(0.4));
    const blurField   = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
        (e.currentTarget.style.borderColor = C.cyanA(0.14));

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-5">

                {/* ── Config card ── */}
                <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: C.cyanA(0.1), border: `1px solid ${C.cyanA(0.2)}` }}>
                            <ShieldCheck className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 4px ${C.cyanA(0.7)})` }} />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold" style={{ color: C.text }}>Configuración DTE (Lioren)</h3>
                            <p className="text-[12px]" style={{ color: C.muted }}>
                                Integración para emitir documentos tributarios electrónicos (SII Chile).
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 py-6 text-[13px]" style={{ color: C.muted }}>
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.cyan }} /> Cargando configuración...
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Token */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.cyanA(0.5) }}>
                                    Token de Lioren
                                </label>
                                <input type="password" value={liorenToken}
                                    onChange={e => setLiorenToken(e.target.value)}
                                    placeholder="Ingresa tu token de API"
                                    style={fieldStyle}
                                    onFocus={focusField} onBlur={blurField} />
                            </div>

                            {/* Logo */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.cyanA(0.5) }}>
                                    Logo para documentos
                                </label>
                                {liorenLogo ? (
                                    <div className="flex items-center gap-3 p-3 rounded-xl"
                                        style={{ background: C.cyanA(0.04), border: `1px solid ${C.cyanA(0.14)}` }}>
                                        <img src={liorenLogo} alt="Logo DTE" className="h-12 w-auto object-contain rounded-lg"
                                            onError={e => (e.currentTarget.style.display = 'none')} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] truncate" style={{ color: C.muted }}>{liorenLogo}</p>
                                        </div>
                                        <button type="button" onClick={() => setLiorenLogo('')}
                                            className="p-1.5 rounded-lg transition-all"
                                            style={{ color: C.muted }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.color = C.red;
                                                (e.currentTarget as HTMLElement).style.background = C.redA(0.1);
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.color = C.muted;
                                                (e.currentTarget as HTMLElement).style.background = '';
                                            }}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-[13px] transition-all disabled:opacity-50"
                                        style={{ border: `1.5px dashed ${C.cyanA(0.2)}`, color: C.muted }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.borderColor = C.cyanA(0.4);
                                            (e.currentTarget as HTMLElement).style.color = C.cyan;
                                            (e.currentTarget as HTMLElement).style.background = C.cyanA(0.04);
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.borderColor = C.cyanA(0.2);
                                            (e.currentTarget as HTMLElement).style.color = C.muted;
                                            (e.currentTarget as HTMLElement).style.background = '';
                                        }}>
                                        {uploadingLogo
                                            ? <><Loader2 className="w-4 h-4 animate-spin" />Subiendo...</>
                                            : <><Upload className="w-4 h-4" />Subir logo <span className="text-[11px]" style={{ color: C.subtle }}>(JPG, PNG — máx 5MB)</span></>}
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                                    className="hidden" onChange={handleLogoUpload} />
                                <p className="text-[11px] mt-1.5" style={{ color: C.subtle }}>
                                    Aparece en el encabezado de boletas y facturas electrónicas
                                </p>
                            </div>

                            {/* Resolución */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.cyanA(0.5) }}>
                                        Número de Resolución SII
                                    </label>
                                    <input type="text" value={dteResolution}
                                        onChange={e => setDteResolution(e.target.value)}
                                        placeholder="Ej: 80"
                                        style={fieldStyle}
                                        onFocus={focusField} onBlur={blurField} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.cyanA(0.5) }}>
                                        Fecha de Resolución
                                    </label>
                                    <input type="date" value={resolutionDate}
                                        onChange={e => setResolutionDate(e.target.value)}
                                        style={fieldStyle}
                                        onFocus={focusField} onBlur={blurField} />
                                </div>
                            </div>

                            {/* Guardar */}
                            <div className="pt-1">
                                <button onClick={() => saveConfig()} disabled={isPending || !tenantId}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150 disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,rgba(0,153,204,0.25) 0%,rgba(0,153,204,0.1) 100%)', border: `1px solid ${C.cyanA(0.35)}`, color: C.cyan }}
                                    onMouseEnter={e => !isPending && ((e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,rgba(0,153,204,0.35) 0%,rgba(0,153,204,0.18) 100%)')}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,rgba(0,153,204,0.25) 0%,rgba(0,153,204,0.1) 100%)'}>
                                    {isPending
                                        ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
                                        : <><Save className="w-4 h-4" />Guardar configuración</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Stats card ── */}
                <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-[15px] font-bold" style={{ color: C.text }}>Actividad DTE</h3>
                            <p className="text-[12px] mt-0.5" style={{ color: C.muted }}>
                                Documentos tributarios emitidos con tu cuenta
                            </p>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: C.greenA(0.1), color: C.green, border: `1px solid ${C.greenA(0.2)}` }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />Lioren
                        </span>
                    </div>
                    <DteStatsPanel tenantId={tenantId} />
                </div>

            </div>
        </DashboardLayout>
    );
}
