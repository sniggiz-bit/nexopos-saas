import { Link } from 'react-router-dom';
import { CheckCircle, TrendingUp, Package, CreditCard, Building2, FileText, Loader2 } from 'lucide-react';
import { usePublicPlans } from '../hooks/usePublicPlans';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    }).format(price);
};

function PricingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 animate-pulse">
                    <div className="h-8 w-24 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 w-48 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-4 mb-8">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex items-center">
                                <div className="w-5 h-5 bg-gray-200 rounded-full mr-3"></div>
                                <div className="h-4 w-full bg-gray-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                    <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
                </div>
            ))}
        </div>
    );
}

export function LandingPage() {
    const { data: plans, isLoading, isError } = usePublicPlans();

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-white">
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
            <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Planes diseñados para tu negocio
                        </h2>
                        <p className="text-xl text-gray-600">
                            Elige el plan que mejor se adapte a tus necesidades
                        </p>
                    </div>

                    {isLoading ? (
                        <PricingSkeleton />
                    ) : isError ? (
                        <div className="text-center py-12">
                            <p className="text-red-600 font-medium">Error al cargar los planes. Por favor intenta más tarde.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {plans?.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`bg-white rounded-2xl shadow-lg p-8 border-2 transition-all duration-300 relative ${plan.isRecommended
                                        ? 'border-indigo-500 transform scale-105 z-10 shadow-2xl'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {plan.isRecommended && (
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                                            Recomendado
                                        </div>
                                    )}
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <div className="flex items-baseline mb-4">
                                            <span className={`text-5xl font-bold ${plan.isRecommended ? 'text-indigo-600' : 'text-gray-900'}`}>
                                                {formatPrice(plan.price)}
                                            </span>
                                            <span className="text-gray-600 ml-2">/mes</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{plan.description}</p>
                                    </div>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features?.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700 text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        to="/register"
                                        className={`block w-full text-center px-6 py-3 font-semibold rounded-lg transition-all ${plan.isRecommended
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 shadow-lg'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        Comenzar
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-white text-lg font-semibold mb-4">NexoPOS</h3>
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
