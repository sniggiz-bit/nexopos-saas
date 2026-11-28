import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { PublicHeader } from '../components/landing/PublicHeader';
import { loginDestination } from '../lib/login-destination';
import { Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const isSuspended = searchParams.get('suspended') === 'true';

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

            navigate(loginDestination(user.role, location.state?.from), { replace: true });
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-public dark min-h-screen flex bg-[#070913] text-foreground relative overflow-hidden font-sans">
            <PublicHeader dark />
            <aside className="hidden lg:flex lg:w-1/2 items-center justify-center border-r border-white/10 p-12">
                <div className="max-w-md space-y-6">
                    <p className="text-xs uppercase tracking-widest text-cyan-200">NexoPOS · Gestión comercial</p>
                    <h1 className="font-semibold leading-tight text-slate-100">Tu operación, en un mismo lugar.</h1>
                    <p className="text-base leading-relaxed text-slate-300">Ventas, inventario y sucursales en una plataforma para gestionar tu empresa.</p>
                    <p className="border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-400">Accede a tu espacio de trabajo con el correo de tu cuenta.</p>
                </div>
            </aside>
            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
                <div className="w-full max-w-[420px] rounded-3xl p-8 bg-slate-900/30 border border-white/[0.06] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <h2 className="text-xl font-black text-slate-200 tracking-tight">
                            Ingreso al Sistema
                        </h2>
                        <p className="text-xs text-slate-400">
                            Ingresa tus credenciales autorizadas
                        </p>
                    </div>

                    {/* Suspended account banner */}
                    {isSuspended && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                            <p className="text-xs text-red-300 leading-relaxed">
                                Tu cuenta ha sido <span className="font-semibold">suspendida</span>. Contacta al administrador para más información.
                            </p>
                        </div>
                    )}

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

