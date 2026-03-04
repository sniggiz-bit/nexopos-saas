import { Link } from 'react-router-dom';
import { CheckCircle, Building2, FileText, Menu, Globe, Truck } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { useState } from 'react';
import { usePublicPlans } from '../hooks/usePublicPlans';

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: plans, isLoading } = usePublicPlans();

    return (
        <main className="min-h-screen bg-white font-sans">
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
                            <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Características</a>
                            <a href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Precios</a>
                            <Link
                                to="/login"
                                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register"
                                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                            >
                                Comenzar ahora
                            </Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-4 shadow-lg absolute w-full">
                        <a href="#features" className="block text-gray-700 font-medium py-2">Características</a>
                        <a href="#pricing" className="block text-gray-700 font-medium py-2">Precios</a>
                        <Link to="/login" className="block text-gray-700 font-medium py-2">Iniciar Sesión</Link>
                        <Link to="/register" className="block bg-indigo-50 text-indigo-700 text-center rounded-lg font-bold py-3 mt-4">Comenzar ahora</Link>
                    </div>
                )}
            </nav>

            {/* Hero Section (Split Screen) */}
            <section className="relative overflow-hidden bg-slate-50 pt-24 lg:pt-32 pb-16 lg:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        {/* Left Content */}
                        <div className="max-w-2xl text-center lg:text-left pt-10">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm mb-6 border border-indigo-100">
                                <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2"></span>
                                Plataforma B2B para PYMES
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                                Mucho más que un POS: El Sistema de Gestión <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Integral para tu Empresa</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                                Centraliza tus ventas, inventario, proveedores y sucursales en una única plataforma en la nube diseñada para acelerar tu crecimiento.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
                                >
                                    Comenzar gratis
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                                <a
                                    href="#pricing"
                                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    Ver Planes
                                </a>
                            </div>

                            {/* Dato Extra Banner */}
                            <div className="flex items-center justify-center lg:justify-start gap-3 text-sm text-slate-500 bg-white border border-slate-100 py-3 px-5 rounded-lg shadow-sm inline-flex">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Además, incluye <strong>Facturación Electrónica DTE</strong> integrada con el SII.</span>
                            </div>
                        </div>

                        {/* Right Content (Mockup Placeholder) */}
                        <div className="relative mt-12 lg:mt-0 hidden md:block">
                            {/* Decorative background blur */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur-2xl opacity-20"></div>

                            {/* Dashboard Mockup Container */}
                            <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
                                {/* Browser-like Header */}
                                <div className="h-8 border-b border-slate-100 bg-slate-50 flex items-center px-4 space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                </div>
                                {/* Mockup Content Area (Placeholder for actual image) */}
                                <div className="flex-1 bg-slate-50 relative p-4">
                                    <img
                                        src="/dashboard-hero-nexopos.png"
                                        alt="Dashboard NexoPOS Interface"
                                        className="w-full h-full object-cover rounded shadow-sm border border-slate-200"
                                        loading="eager"
                                        onError={(e) => {
                                            // Fallback styling if image not found
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                    {/* Wireframe fallback if image missing */}
                                    <div className="hidden absolute inset-0 m-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                        <Building2 className="w-12 h-12 mb-3 opacity-50" />
                                        <p className="font-medium">Plataforma Empresarial</p>
                                    </div>
                                </div>
                            </div>
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

            {/* Features Section (4 Pillars) */}
            <section id="features" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
                            Todo lo necesario para organizar tu empresa
                        </h2>
                        <p className="text-lg text-slate-600">
                            NexoPOS te entrega herramientas profesionales diseñadas específicamente para un control riguroso operativo y comercial.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Pillar 1: Cotizaciones */}
                        <div className="p-8 md:p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors group">
                            <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Gestión de Cotizaciones</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Crea cotizaciones profesionales en segundos. Convierte propuestas comerciales en ventas cerradas con un solo clic, manteniendo el historial completo de la negociación con tus clientes.
                            </p>
                        </div>

                        {/* Pillar 2: Multisucursal */}
                        <div className="p-8 md:p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors group">
                            <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                                <Building2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Control Multisucursal</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Administra múltiples locales desde un panel centralizado. Visualiza el stock de cada bodega en tiempo real, realiza transferencias de inventario e inspecciona reportes consolidados por sede.
                            </p>
                        </div>

                        {/* Pillar 3: Proveedores y Compras */}
                        <div className="p-8 md:p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-teal-100 transition-colors group">
                            <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 text-teal-600 group-hover:scale-110 transition-transform">
                                <Truck className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Proveedores y Compras</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Abastece tu negocio inteligentemente. Registra órdenes de compra, actualiza tus costos promedio automáticamente y mantén un directorio organizado de todos tus proveedores clave.
                            </p>
                        </div>

                        {/* Pillar 4: Tienda Online */}
                        <div className="p-8 md:p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-100 transition-colors group">
                            <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                                <Globe className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Tienda Online Sincronizada</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Expande tus canales de venta de forma digital. Tu catálogo físico y online comparten el mismo inventario, evitando quiebres de stock y automatizando el flujo completo desde la venta hasta el despacho.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-900 relative border-t border-slate-800">
                {/* Background decoration */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
                            Planes escalables para tu crecimiento
                        </h2>
                        <p className="text-lg text-slate-400">
                            Invierte en la tecnología correcta sin contratos forzosos. Elige el plan que soporte tu operación actual.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20 text-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                            {plans?.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`rounded-3xl p-8 relative text-white transition-all duration-300 ${plan.isRecommended
                                        ? 'bg-slate-800 shadow-2xl border border-indigo-500 transform lg:scale-105 z-10 ring-4 ring-indigo-500/10'
                                        : 'bg-slate-800/50 shadow-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                        }`}
                                >
                                    {plan.isRecommended && (
                                        <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                                            <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-semibold tracking-wide shadow-sm">
                                                Más Popular
                                            </span>
                                        </div>
                                    )}
                                    <div className="mb-8 mt-4">
                                        <h3 className="text-2xl font-bold mb-2 text-slate-50">{plan.name}</h3>
                                        <p className={`text-sm mb-6 ${plan.isRecommended ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {plan.description || 'Ideal para dar el siguiente paso.'}
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-extrabold tracking-tight">
                                                ${plan.price.toLocaleString('es-CL')}
                                            </span>
                                            <span className="text-slate-400 font-medium">/mes</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-4 mb-8">
                                        {(plan.features || []).map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <CheckCircle className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${plan.isRecommended ? 'text-indigo-400' : 'text-slate-500'}`} />
                                                <span className={`${plan.isRecommended ? 'text-slate-200' : 'text-slate-300'} text-sm leading-relaxed`}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        to="/register"
                                        className={`block w-full text-center px-6 py-4 font-semibold rounded-xl transition-all shadow-sm ${plan.isRecommended
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/25'
                                            : 'bg-slate-700 text-white hover:bg-slate-600'
                                            }`}
                                    >
                                        {plan.isRecommended ? 'Comenzar Prueba Gratis' : 'Seleccionar Plan'}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Final */}
            <section className="bg-indigo-600 text-white py-16 sm:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">¿Listo para transformar la gestión de tu empresa?</h2>
                    <p className="text-indigo-100 text-lg mb-8">Únete a las empresas que ya digitalizaron sus operaciones con NexoPOS.</p>
                    <Link to="/register" className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-colors shadow-sm">
                        Comenzar 15 Días Gratis
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <Logo variant="full" className="mb-4" />
                            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                                El sistema inteligente para centralizar ventas, sucursales y operaciones B2B.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-semibold mb-4 text-sm tracking-wide uppercase">Producto</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#features" className="text-slate-600 hover:text-indigo-600 transition-colors">Características</a></li>
                                <li><a href="#pricing" className="text-slate-600 hover:text-indigo-600 transition-colors">Precios</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-semibold mb-4 text-sm tracking-wide uppercase">Compañía</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Contacto</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Soporte</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-semibold mb-4 text-sm tracking-wide uppercase">Legal</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Términos de Servicio</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Privacidad</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                        <p>© {new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
