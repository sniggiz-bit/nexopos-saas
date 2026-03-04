import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Logo } from '../components/ui/Logo';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
            login(access_token, user);

            toast.success(`Bienvenido, ${user.name || user.email}`);

            // Redirect based on role
            if (user.role === 'TENANT_ADMIN') {
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
        <div className="min-h-screen flex">
            {/* ── Left visual panel (hidden on mobile) ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a0f1e]">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b4b] via-[#0a2a3b] to-[#062a1a] opacity-90" />

                {/* Animated glow orbs */}
                <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full bg-blue-600 opacity-20 blur-3xl animate-pulse" />
                <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-emerald-500 opacity-20 blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-400 opacity-10 blur-2xl" />

                {/* Text content */}
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="mb-6 flex items-center gap-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_2px_#34d399]" />
                        <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
                            NexoPOS Platform
                        </span>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                        Gestiona tu negocio{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            al siguiente nivel
                        </span>
                    </h1>
                    <p className="mt-6 text-slate-400 text-lg leading-relaxed max-w-sm">
                        Control total de ventas, inventario y clientes desde una sola plataforma moderna.
                    </p>

                    {/* Feature badges */}
                    <div className="mt-10 flex flex-col gap-4">
                        {[
                            { icon: '⚡', label: 'Punto de venta en tiempo real' },
                            { icon: '📦', label: 'Gestión de inventario inteligente' },
                            { icon: '📊', label: 'Reportes y analíticas avanzadas' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-slate-300 text-sm">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom corner accent */}
                <div className="absolute bottom-8 left-16 text-slate-600 text-xs">
                    © {new Date().getFullYear()} NexoPOS · Todos los derechos reservados
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 sm:px-12 lg:px-16">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <Logo variant="full" className="h-12 w-auto" />
                        <h2 className="mt-6 text-2xl font-bold text-gray-800 tracking-tight">
                            Bienvenido de vuelta
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email-address"
                                className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                                Correo Electrónico
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="
                                    w-full rounded-xl border border-gray-200 bg-white px-4 py-3
                                    text-gray-900 placeholder-gray-400 text-sm shadow-sm
                                    transition duration-150
                                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
                                "
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                                Contraseña
                            </label>
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
                                    w-full rounded-xl border border-gray-200 bg-white px-4 py-3
                                    text-gray-900 placeholder-gray-400 text-sm shadow-sm
                                    transition duration-150
                                    focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30
                                "
                            />
                        </div>

                        {/* Forgot password */}
                        <div className="flex justify-end">
                            <a
                                href="#"
                                className="text-xs text-blue-600 hover:text-emerald-600 transition-colors duration-200 font-medium"
                            >
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                                relative w-full flex items-center justify-center gap-2
                                py-3.5 px-6 rounded-xl text-sm font-semibold text-white
                                transition-all duration-200 overflow-hidden
                                focus:outline-none focus:ring-4 focus:ring-blue-500/30
                                ${isLoading
                                    ? 'opacity-70 cursor-not-allowed bg-blue-500'
                                    : 'bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
                                }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4 text-white"
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
                                    Ingresando...
                                </>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
