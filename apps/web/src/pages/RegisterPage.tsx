import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Copy, CheckCircle2, User, Mail, Phone, ArrowRight } from 'lucide-react';
import { PublicHeader } from '../components/landing/PublicHeader';
import { api } from '../api/client';
import BusinessRegistrationFields from '../components/registration/BusinessRegistrationFields';

function generatePassword(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    const [formData, setFormData] = useState({ name: '', email: '', phone: '', companyName: '', rut: '', giro: '', address: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const password = generatePassword();

        try {
            const response = await api.post('/auth/register-tenant', {
                companyName: formData.companyName.trim(),
                rut: formData.rut || undefined,
                giro: formData.giro.trim() || undefined,
                address: formData.address.trim() || undefined,
                userName: formData.name,
                email: formData.email,
                phone: formData.phone,
                password,
            });
            const data = response.data;

            setGeneratedPassword(password);
            queryClient.clear();
            login(data.access_token, data.user);
            toast.success('¡Cuenta creada! Guarda tu contraseña antes de continuar.');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al crear la cuenta';
            toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(generatedPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
    };

    const handleContinue = () => navigate('/dashboard');

    // ── Success screen ────────────────────────────────────────────────────────
    if (generatedPassword) {
        return (
            <div className="auth-public dark min-h-screen bg-[#070913] flex items-center justify-center py-12 px-4 relative overflow-hidden font-sans text-slate-200">
                <PublicHeader dark />
                {/* Background elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
                
                <div className="max-w-md w-full relative z-10">
                    <div className="bg-slate-900/40 border border-white/[0.08] backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-dashed animate-[spin_10s_linear_infinite] opacity-50" />
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-200 mb-2">¡Espacio creado!</h2>
                        <p className="text-slate-400 text-sm mb-8">Guarda tu contraseña temporal antes de continuar</p>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-8 text-left shadow-inner">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tu contraseña temporal</p>
                            <div className="flex items-center gap-2 bg-[#070913] rounded-xl p-2 border border-white/[0.05]">
                                <code className="flex-1 text-lg font-mono font-bold text-emerald-400 tracking-wider select-all px-3">
                                    {showPassword ? generatedPassword : '••••••••••'}
                                </code>
                                <button
                                    onClick={() => setShowPassword(v => !v)}
                                    className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleCopyPassword}
                                    className={`p-2.5 rounded-lg transition-all ${copiedPassword ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}
                                    title="Copiar"
                                >
                                    {copiedPassword ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
                                Recomendamos cambiarla en Configuración → Mi perfil
                            </p>
                        </div>

                        <button
                            onClick={handleContinue}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Ingresar a mi Dashboard <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Registration form ─────────────────────────────────────────────────────
    return (
        <div className="auth-public dark min-h-screen flex bg-[#070913] relative overflow-hidden font-sans text-slate-200">
            <PublicHeader dark />
            <aside className="hidden lg:flex lg:w-1/2 items-center justify-center border-r border-white/10 p-12">
                <div className="max-w-md space-y-6">
                    <p className="text-xs uppercase tracking-widest text-cyan-200">NexoPOS · Gestión comercial</p>
                    <h1 className="font-semibold leading-tight text-slate-100">Comienza a organizar tu operación.</h1>
                    <p className="text-base leading-relaxed text-slate-300">Ventas, inventario y sucursales en una plataforma para gestionar tu empresa.</p>
                    <p className="border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-400">Crea tu cuenta e inicia tu prueba gratuita de 15 días.</p>
                </div>
            </aside>
            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
                <div className="w-full max-w-lg rounded-3xl p-8 bg-slate-900/30 border border-white/[0.06] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <h2 className="text-xl font-black text-slate-200 tracking-tight">
                            Crea tu cuenta
                        </h2>
                        <p className="text-xs text-slate-400">
                            Completa los datos para iniciar tu prueba gratuita
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <fieldset disabled={isLoading} className="space-y-4 border-b border-white/10 pb-5">
                            <legend className="mb-3 text-base font-semibold text-slate-200">Datos del negocio</legend>
                            <BusinessRegistrationFields values={formData} disabled={isLoading} onChange={updateBusiness => setFormData(current => ({ ...current, ...updateBusiness(current) }))} inputClassName="rounded-xl border-white/10 bg-white/[0.03] text-slate-200 placeholder:text-slate-500" />
                        </fieldset>
                        <h3 className="pt-1 text-base font-semibold text-slate-200">Datos del administrador</h3>
                        {/* Name */}
                        <div className="space-y-1.5 group">
                            <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-purple-400 transition-colors">
                                Nombre completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="
                                        w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3
                                        text-slate-200 placeholder-slate-500 text-sm shadow-inner
                                        transition-all duration-200 focus:outline-none focus:bg-white/[0.05]
                                        focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10
                                    "
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 group">
                            <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="
                                        w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3
                                        text-slate-200 placeholder-slate-500 text-sm shadow-inner
                                        transition-all duration-200 focus:outline-none focus:bg-white/[0.05]
                                        focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10
                                    "
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5 group">
                            <label htmlFor="phone" className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                                Teléfono
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    placeholder="+56 9 1234 5678"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="
                                        w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3
                                        text-slate-200 placeholder-slate-500 text-sm shadow-inner
                                        transition-all duration-200 focus:outline-none focus:bg-white/[0.05]
                                        focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10
                                    "
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                                    relative w-full flex items-center justify-center gap-2
                                    py-3.5 px-6 rounded-xl text-sm font-bold text-white
                                    transition-all duration-300 overflow-hidden shadow-lg
                                    focus:outline-none focus:ring-4 focus:ring-purple-500/20
                                    ${isLoading
                                        ? 'opacity-70 cursor-not-allowed bg-slate-800 border border-white/[0.08]'
                                        : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 hover:opacity-95 hover:shadow-indigo-500/20 active:scale-[0.98]'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderIcon />
                                        Creando espacio...
                                    </>
                                ) : (
                                    <>
                                        Crear cuenta gratis <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex justify-center mt-6">
                            <p className="text-xs text-slate-400">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Inicia sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function LoaderIcon() {
    return (
        <svg
            className="animate-spin h-4 w-4 text-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}
