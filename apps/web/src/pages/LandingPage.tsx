import { Link } from 'react-router-dom';
import { CheckCircle, TrendingUp, Package, CreditCard, Building2, FileText, Menu } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { useState } from 'react';

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Link to="/">
                                <Logo variant="full" />
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium">Características</a>
                            <a href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium">Precios</a>
                            <Link
                                to="/login"
                                className="text-gray-600 hover:text-indigo-600 font-medium"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register"
                                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Comenzar ahora
                            </Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-600 p-2"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-4">
                        <a href="#features" className="block text-gray-600 font-medium">Características</a>
                        <a href="#pricing" className="block text-gray-600 font-medium">Precios</a>
                        <Link to="/login" className="block text-gray-600 font-medium">Iniciar Sesión</Link>
                        <Link to="/register" className="block text-indigo-600 font-bold">Comenzar ahora</Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
                    <div className="text-center">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
                            Gestiona tu negocio
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                con inteligencia
                            </span>
                        </h1>
                        <p className="mt-6 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Sistema de punto de venta completo con facturación electrónica,
                            control de inventario multisucursal y reportes en tiempo real.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Prueba Gratis 15 Días
                            </Link>
                            <a
                                href="#pricing"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
                            >
                                Ver Planes
                            </a>
                        </div>
                    </div>
                    {/* Hero Image Dashboard */}
                    <div className="mt-16 sm:mt-24 flex justify-center relative z-10">
                        <img
                            src="/dashboard-hero-nexopos.png"
                            alt="Dashboard NexoPOS"
                            className="w-full max-w-5xl rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200/50 object-cover object-center"
                            loading="eager"
                        />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Todo lo que necesitas para crecer
                        </h2>
                        <p className="text-xl text-gray-600">
                            Herramientas profesionales diseñadas para tu éxito
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 bg-gradient-to-br from-white to-indigo-50 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                                <Building2 className="w-7 h-7 text-indigo-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Multisucursal</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Gestiona múltiples sucursales desde un solo sistema. Transfiere inventario y consolida reportes en tiempo real.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                                <FileText className="w-7 h-7 text-purple-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Facturación Electrónica (DTE)</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Emite boletas y facturas electrónicas cumpliendo con la normativa del SII. Integración directa con Lioren.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-8 bg-gradient-to-br from-white to-green-50 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                                <Package className="w-7 h-7 text-green-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Control de Inventario</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Kardex detallado, alertas de stock crítico y control por sucursal. Nunca más te quedes sin productos.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                                <CreditCard className="w-7 h-7 text-blue-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Punto de Venta Rápido</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Interfaz optimizada para ventas rápidas. Múltiples métodos de pago y búsqueda inteligente de productos.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="group p-8 bg-gradient-to-br from-white to-orange-50 rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
                                <TrendingUp className="w-7 h-7 text-orange-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Reportes en Tiempo Real</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Dashboard con métricas clave. Ventas, inventario, tesorería y más. Toma decisiones basadas en datos.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="group p-8 bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-600 transition-colors">
                                <CheckCircle className="w-7 h-7 text-pink-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Fácil de Usar</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Diseño intuitivo que tu equipo aprenderá en minutos. Sin curvas de aprendizaje complicadas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Planes diseñados para tu negocio
                        </h2>
                        <p className="text-xl text-slate-400">
                            Elige el plan que mejor se adapte a tus necesidades
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                        {/* Plan Light */}
                        <div className="bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 relative text-white">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Plan Light</h3>
                                <p className="text-slate-400 text-sm mb-4">Básico</p>
                                <div className="flex items-baseline mb-4">
                                    <span className="text-5xl font-bold">$X.XXX</span>
                                    <span className="text-slate-400 ml-2">/mes</span>
                                </div>
                                <p className="text-slate-400 text-sm">Ideal para emprendedores y pequeños negocios que recién comienzan.</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Punto de Venta básico',
                                    'Control de Inventario',
                                    '1 Usuario',
                                    'Soporte por email'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className="block w-full text-center px-6 py-3 font-semibold rounded-lg transition-all bg-slate-700 text-white hover:bg-slate-600"
                            >
                                Comenzar
                            </Link>
                        </div>

                        {/* Plan Elevate (Destacado) */}
                        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border-2 border-green-500 transform lg:scale-105 z-10 relative text-white shadow-green-500/20">
                            <div className="absolute top-0 right-0 bg-green-500 text-slate-900 px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-bold">
                                Más Popular
                            </div>
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Plan Elevate</h3>
                                <p className="text-green-400 text-sm mb-4">Destacado / Profesional</p>
                                <div className="flex items-baseline mb-4">
                                    <span className="text-5xl font-bold text-white">$X.XXX</span>
                                    <span className="text-slate-400 ml-2">/mes</span>
                                </div>
                                <p className="text-slate-400 text-sm">Perfecto para negocios en crecimiento que necesitan herramientas avanzadas.</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Facturación Electrónica (DTE)',
                                    'Múltiples sucursales',
                                    'Reportes avanzados',
                                    '5 Usuarios',
                                    'Soporte prioritario 24/7'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className="block w-full text-center px-6 py-3 font-semibold rounded-lg transition-all bg-green-500 text-slate-900 hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1"
                            >
                                Comenzar Ahora
                            </Link>
                        </div>

                        {/* Plan Vanguard */}
                        <div className="bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 relative text-white">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Plan Vanguard</h3>
                                <p className="text-slate-400 text-sm mb-4">Avanzado / Premium</p>
                                <div className="flex items-baseline mb-4">
                                    <span className="text-5xl font-bold">$X.XXX</span>
                                    <span className="text-slate-400 ml-2">/mes</span>
                                </div>
                                <p className="text-slate-400 text-sm">Para grandes empresas que requieren soluciones a medida y máxima capacidad.</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Todas las funciones Elevate',
                                    'Usuarios ilimitados',
                                    'API de integración',
                                    'Desarrollo personalizado',
                                    'Ejecutivo de cuenta dedicado'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className="block w-full text-center px-6 py-3 font-semibold rounded-lg transition-all bg-slate-700 text-white hover:bg-slate-600"
                            >
                                Comenzar
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <Logo variant="full" mode="dark" className="mb-4 opacity-80 hover:opacity-100 transition-opacity" />
                            <p className="text-sm text-gray-400">
                                Sistema de gestión empresarial diseñado para el éxito de tu negocio.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Producto</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Integraciones</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Soporte</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                        <p>© {new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
