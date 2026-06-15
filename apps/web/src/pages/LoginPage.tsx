import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Logo } from '../components/ui/Logo';
import { Mail, Lock, Sparkles, Database, ArrowRight, Compass } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password,
            });

            const { access_token, user } = response.data;
            queryClient.clear();
            login(access_token, user);

            toast.success(`Bienvenido, ${user.name || user.email}`);

            // Redirect based on role
            if (user.role === 'SUPER_ADMIN') {
                navigate('/admin/dashboard');
            } else if (user.role === 'TENANT_ADMIN' || user.role === 'MANAGER') {
                navigate('/dashboard');
            } else if (user.role === 'CASHIER') {
                navigate('/pos');
            } else {
                navigate(from === '/login' ? '/' : from);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dark min-h-screen flex bg-[#070913] text-foreground relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[150px]" />

            {/* ── Left visual panel (hidden on mobile) ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
                
                {/* Visual content container */}
                <div className="relative z-10 w-full max-w-lg space-y-8">
                    {/* Pulsing indicator badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 absolute" />
                        <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase">
                            NexoPOS Cloud Core
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl xl:text-5xl font-black text-foreground leading-tight tracking-tight">
                            Gestiona tu negocio{' '}
                            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                                al siguiente nivel
                            </span>
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed">
                            Control total de ventas, inventario y facturación SII Chile en tiempo real desde una interfaz ágil, moderna y segura.
                        </p>
                    </div>

                    {/* Premium feature cards */}
                    <div className="grid gap-4 mt-6">
                        {[
                            { icon: Sparkles, color: 'text-cyan-400 bg-cyan-400/10', label: 'Ventas en Posición Rápida (POS)', desc: 'Facturación y boletas SII en segundos' },
                            { icon: Database, color: 'text-indigo-400 bg-indigo-400/10', label: 'Inventario Automatizado', desc: 'Alertas de stock y trazabilidad de Kardex' },
                            { icon: Compass, color: 'text-emerald-400 bg-emerald-400/10', label: 'Reportes y Finanzas Inteligentes', desc: 'Cierre de turnos y arqueos sin discrepancias' },
                        ].map((item) => (
                            <div key={item.label} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-slate-200 font-bold text-sm">{item.label}</h4>
                                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer copyright */}
                <div className="absolute bottom-8 left-12 text-slate-500 text-[11px] font-mono">
                    © {new Date().getFullYear()} NEXOPOS · CONEXIÓN SEGURA SSL
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
                <div className="w-full max-w-[420px] rounded-3xl p-8 bg-slate-900/30 border border-white/[0.06] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/[0.05] mb-2">
                            <Logo variant="full" className="h-10 w-auto" mode="dark" />
                        </div>
                        <h2 className="text-xl font-black text-slate-200 tracking-tight">
                            Ingreso al Sistema
                        </h2>
                        <p className="text-xs text-slate-400">
                            Ingresa tus credenciales autorizadas
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5 group">
                            <label htmlFor="email-address" className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="
                                        w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3
                                        text-slate-200 placeholder-slate-500 text-sm shadow-inner
                                        transition-all duration-200 focus:outline-none focus:bg-white/[0.05]
                                        focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10
                                    "
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5 group">
                            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="
                                        w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3
                                        text-slate-200 placeholder-slate-500 text-sm shadow-inner
                                        transition-all duration-200 focus:outline-none focus:bg-white/[0.05]
                                        focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10
                                    "
                                />
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div className="flex justify-end">
                            <a href="#" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors duration-200 font-medium">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                                relative w-full flex items-center justify-center gap-2
                                py-3.5 px-6 rounded-xl text-sm font-bold text-white
                                transition-all duration-300 overflow-hidden shadow-lg
                                focus:outline-none focus:ring-4 focus:ring-cyan-500/20
                                ${isLoading
                                    ? 'opacity-70 cursor-not-allowed bg-slate-800 border border-white/[0.08]'
                                    : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 hover:opacity-95 hover:shadow-cyan-500/10 active:scale-[0.98]'
                                }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <LoaderIcon />
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    Ingresar <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
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

