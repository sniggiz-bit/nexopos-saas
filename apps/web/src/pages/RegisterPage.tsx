import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

interface RegisterFormData {
    companyName: string;
    userName: string;
    email: string;
    phone: string;
    password: string;
}

export function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<RegisterFormData>({
        companyName: '',
        userName: '',
        email: '',
        phone: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/auth/register-tenant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear la cuenta');
            }

            const data = await response.json();

            // Auto-login with returned token
            login(data.access_token, data.user);

            toast.success('¡Cuenta creada exitosamente! Bienvenido a NexoPOS 🎉');

            // Redirect to dashboard based on role
            if (data.user.role === 'SUPER_ADMIN') {
                navigate('/admin/dashboard');
            } else {
                // Redirect to client admin dashboard
                navigate('/dashboard');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Error al crear la cuenta. Por favor intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col items-center mb-6">
                        <Logo variant="full" className="h-10" />
                    </div>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Crea tu cuenta
                        </h2>
                        <p className="text-gray-600">
                            Comienza tu prueba gratuita de 15 días
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Empresa *
                            </label>
                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                required
                                value={formData.companyName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Ej: Botillería El Cielo"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                                Tu Nombre *
                            </label>
                            <input
                                id="userName"
                                name="userName"
                                type="text"
                                required
                                value={formData.userName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Ej: Juan Pérez"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono *
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="+56 9 1234 5678"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Mínimo 8 caracteres"
                                disabled={isLoading}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Debe tener al menos 8 caracteres
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Creando tu espacio de trabajo...
                                </>
                            ) : (
                                'Crear Cuenta Gratis'
                            )}
                        </button>

                        <p className="text-center text-sm text-gray-600">
                            ¿Ya tienes cuenta?{' '}
                            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Inicia sesión
                            </a>
                        </p>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Al crear una cuenta, aceptas nuestros{' '}
                    <a href="#" className="underline hover:text-gray-700">Términos de Servicio</a>
                    {' '}y{' '}
                    <a href="#" className="underline hover:text-gray-700">Política de Privacidad</a>
                </p>
            </div>
        </div>
    );
}
