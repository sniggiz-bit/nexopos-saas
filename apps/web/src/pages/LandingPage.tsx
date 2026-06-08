import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Building2, FileText, Menu, Globe, Truck, ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { PublicChatWidget } from '../components/landing/PublicChatWidget';
import { usePublicPlans } from '../hooks/usePublicPlans';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface LandingConfig {
    hero: {
        badge: string; title: string; titleHighlight: string;
        description: string; ctaPrimary: string; ctaSecondary: string; dteBanner: string;
    };
    features: { sectionTitle: string; sectionSubtitle: string; items: { title: string; description: string }[] };
    pricing: { title: string; subtitle: string };
    cta: { title: string; subtitle: string; button: string };
    footer: { description: string };
    seo?: { title: string; description: string; keywords: string };
    chatbot?: { enabled: boolean; welcomeMessage: string; options: string[] };
}

const DEFAULT_CFG: LandingConfig = {
    hero: {
        badge: 'Plataforma B2B para PYMES',
        title: 'Mucho más que un POS: El Sistema de Gestión',
        titleHighlight: 'Integral para tu Empresa',
        description: 'Centraliza tus ventas, inventario, proveedores y sucursales en una única plataforma en la nube diseñada para acelerar tu crecimiento.',
        ctaPrimary: 'Comenzar gratis',
        ctaSecondary: 'Ver Planes',
        dteBanner: 'Además, incluye Facturación Electrónica DTE integrada con el SII.',
    },
    features: {
        sectionTitle: 'Todo lo necesario para organizar tu empresa',
        sectionSubtitle: 'NexoPOS te entrega herramientas profesionales diseñadas específicamente para un control riguroso operativo y comercial.',
        items: [
            { title: 'Gestión de Cotizaciones', description: 'Crea cotizaciones profesionales en segundos. Convierte propuestas comerciales en ventas cerradas con un solo clic, manteniendo el historial completo de la negociación con tus clientes.' },
            { title: 'Control Multisucursal', description: 'Administra múltiples locales desde un panel centralizado. Visualiza el stock de cada bodega en tiempo real, realiza transferencias de inventario e inspecciona reportes consolidados por sede.' },
            { title: 'Proveedores y Compras', description: 'Abastece tu negocio inteligentemente. Registra órdenes de compra, actualiza tus costos promedio automáticamente y mantén un directorio organizado de todos tus proveedores clave.' },
            { title: 'Tienda Online Sincronizada', description: 'Expande tus canales de venta de forma digital. Tu catálogo físico y online comparten el mismo inventario, evitando quiebres de stock y automatizando el flujo completo desde la venta hasta el despacho.' },
        ],
    },
    pricing: {
        title: 'Planes escalables para tu crecimiento',
        subtitle: 'Invierte en la tecnología correcta sin contratos forzosos. Elige el plan que soporte tu operación actual.',
    },
    cta: {
        title: '¿Listo para transformar la gestión de tu empresa?',
        subtitle: 'Únete a las empresas que ya digitalizaron sus operaciones con NexoPOS.',
        button: 'Comenzar 15 Días Gratis',
    },
    footer: { description: 'El sistema inteligente para centralizar ventas, sucursales y operaciones B2B.' },
    seo: {
        title: 'NexoPOS - Sistema de Gestión',
        description: 'La plataforma B2B para administrar tu negocio.',
        keywords: 'pos, ventas, inventario'
    },
    chatbot: {
        enabled: true,
        welcomeMessage: '¡Hola! Soy tu asistente virtual NexoPOS. ¿En qué te puedo ayudar hoy?',
        options: ['Ventas / Planes', 'Soporte', 'Facturación']
    }
};

const FEATURE_ICONS = [
    { icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hover: 'hover:border-indigo-500/40 hover:bg-indigo-500/5' },
    { icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hover: 'hover:border-cyan-500/40 hover:bg-cyan-500/5' },
    { icon: Truck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40 hover:bg-emerald-500/5' },
    { icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40 hover:bg-purple-500/5' },
];

function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key of Object.keys(override ?? {})) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
            result[key] = deepMerge(base[key] ?? {}, override[key]);
        } else if (override[key] !== undefined && override[key] !== null) {
            result[key] = override[key];
        }
    }
    return result;
}

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: plans, isLoading: plansLoading } = usePublicPlans();

    const { data: remoteCfg } = useQuery<LandingConfig>({
        queryKey: ['landing-config'],
        queryFn: () => apiClient.get('/landing-config').then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });

    const cfg: LandingConfig = remoteCfg ? deepMerge(DEFAULT_CFG, remoteCfg) : DEFAULT_CFG;
    const { hero, features, pricing, cta, footer, seo } = cfg as any;

    React.useEffect(() => {
        if (seo?.title) {
            document.title = seo.title;
        }
        if (seo?.description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', seo.description);
        }
        if (seo?.keywords) {
            let metaKeys = document.querySelector('meta[name="keywords"]');
            if (!metaKeys) {
                metaKeys = document.createElement('meta');
                metaKeys.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeys);
            }
            metaKeys.setAttribute('content', seo.keywords);
        }
    }, [seo]);

    return (
        <main className="min-h-screen bg-[#070913] text-slate-100 font-sans relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
            {/* Fine tech grid background overlay */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-40" 
                style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Glowing backdrop orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-float-slow pointer-events-none" />
            <div className="absolute top-[30%] right-[-10%] w-[55%] h-[55%] rounded-full bg-emerald-500/8 blur-[130px] animate-float-reverse pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[150px] animate-float pointer-events-none" />

            {/* Navigation Header */}
            <nav className="fixed w-full bg-[#070913]/60 backdrop-blur-xl z-50 border-b border-white/[0.06] transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <Logo variant="full" className="h-9 w-auto brightness-0 invert opacity-95" />
                        </Link>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Características</a>
                            <a href="#pricing" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Precios</a>
                            <Link to="/login" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Iniciar Sesión</Link>
                            <Link 
                                to="/register" 
                                className="
                                    bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 text-white 
                                    px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.15)]
                                    hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-[0.98] 
                                    transition-all duration-200
                                "
                            >
                                Comenzar ahora
                            </Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                className="text-slate-300 p-2 hover:bg-white/[0.05] rounded-xl transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-[#0d1226]/95 border-b border-white/[0.08] px-4 pt-2 pb-6 space-y-3 shadow-2xl absolute w-full backdrop-blur-xl animate-fade-up">
                        <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Características</a>
                        <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Precios</a>
                        <Link to="/login" className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Iniciar Sesión</Link>
                        <Link 
                            to="/register" 
                            className="
                                block text-center py-3 mt-4 rounded-xl font-bold text-white
                                bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500
                            "
                        >
                            Comenzar ahora
                        </Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 lg:pt-36 pb-20 lg:pb-32 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Hero Text */}
                        <div className="max-w-2xl text-center lg:text-left space-y-6">
                            {/* Glowing Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase animate-fade-up">
                                <Sparkles className="w-3.5 h-3.5" />
                                {hero.badge}
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] animate-fade-up">
                                {hero.title}{' '}
                                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent block mt-2">
                                    {hero.titleHighlight}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                {hero.description}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                                <Link 
                                    to="/register" 
                                    className="
                                        inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white 
                                        bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-xl
                                        shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]
                                        hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
                                    "
                                >
                                    {hero.ctaPrimary}
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a 
                                    href="#pricing" 
                                    className="
                                        inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-slate-200 
                                        bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] 
                                        hover:border-white/[0.15] transition-all duration-200
                                    "
                                >
                                    {hero.ctaSecondary}
                                </a>
                            </div>

                            {/* DTE Notice Banner */}
                            <div className="flex items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm text-slate-400 bg-white/[0.02] border border-white/[0.06] py-3 px-5 rounded-2xl shadow-inner inline-flex backdrop-blur-md">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: hero.dteBanner.replace('Facturación Electrónica DTE', '<strong class="text-cyan-300 font-bold">Facturación Electrónica DTE</strong>') }} />
                            </div>
                        </div>

                        {/* Hero Demo Graphic */}
                        <div className="relative mt-8 lg:mt-0 hidden lg:block animate-float-slow">
                            {/* Glowing light background backing */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 rounded-2xl blur-3xl opacity-30"></div>
                            
                            {/* Outer Glass Card */}
                            <div className="relative rounded-2xl bg-slate-900/30 border border-white/[0.08] shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden aspect-[4/3] flex flex-col backdrop-blur-xl">
                                <div className="h-9 border-b border-white/[0.06] bg-slate-950/40 flex items-center px-4 space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/40"></div>
                                </div>
                                <div className="flex-1 bg-slate-950/20 relative p-4">
                                    <img 
                                        src="/dashboard-hero-nexopos.png" 
                                        alt="Dashboard NexoPOS" 
                                        className="w-full h-full object-cover rounded-xl shadow-md border border-white/[0.05]"
                                        onError={e => { 
                                            (e.target as HTMLImageElement).style.display = 'none'; 
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); 
                                        }} 
                                    />
                                    <div className="hidden absolute inset-0 m-4 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-slate-400">
                                        <Building2 className="w-12 h-12 mb-3 opacity-40 text-cyan-400" />
                                        <p className="font-semibold text-sm tracking-wide text-slate-200">Plataforma B2B Unificada</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Main Graphic (visible on all) */}
                    <div className="mt-16 sm:mt-28 flex justify-center relative z-10 animate-fade-up">
                        <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-2xl blur-3xl opacity-40"></div>
                        <img 
                            src="/dashboard-hero-nexopos.png" 
                            alt="Dashboard NexoPOS" 
                            className="w-full max-w-5xl rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-white/[0.08] object-cover object-center relative z-10" 
                            loading="eager" 
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 lg:py-32 relative z-10 border-t border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-3xl font-black text-white sm:text-4xl tracking-tight">
                            {features.sectionTitle}
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                            {features.sectionSubtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                        {features.items.map((item, i) => {
                            const { icon: Icon, color, bg, border, hover } = FEATURE_ICONS[i] ?? FEATURE_ICONS[0];
                            return (
                                <div 
                                    key={i} 
                                    className={`
                                        p-8 md:p-10 rounded-3xl bg-white/[0.01] border border-white/[0.05] 
                                        ${hover} backdrop-blur-md transition-all duration-300 group hover:-translate-y-1
                                    `}
                                >
                                    <div 
                                        className={`
                                            w-14 h-14 ${bg} ${border} border rounded-2xl flex items-center justify-center mb-6 
                                            group-hover:scale-110 transition-transform duration-300
                                        `}
                                    >
                                        <Icon className={`w-6 h-6 ${color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-3">{item.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 lg:py-32 relative z-10 border-t border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-3xl font-black text-white sm:text-4xl tracking-tight">{pricing.title}</h2>
                        <p className="text-slate-400 text-sm sm:text-base">{pricing.subtitle}</p>
                    </div>
                    
                    {plansLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-cyan-400"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                            {plans?.map(plan => (
                                <div 
                                    key={plan.id} 
                                    className={`
                                        rounded-3xl p-8 relative flex flex-col justify-between backdrop-blur-md transition-all duration-300 
                                        ${plan.isRecommended 
                                            ? 'bg-slate-900/60 border-2 border-cyan-500/80 shadow-[0_0_40px_rgba(6,182,212,0.15)] transform lg:scale-105 z-10 ring-4 ring-cyan-500/5' 
                                            : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-[#0d1226]/40 shadow-lg'
                                        }
                                    `}
                                >
                                    {plan.isRecommended && (
                                        <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                                            <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                                                Más Popular
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-6">
                                        <div className="border-b border-white/[0.06] pb-6 mt-2">
                                            <h3 className="text-xl font-bold text-slate-100 mb-1">{plan.name}</h3>
                                            <p className="text-xs text-slate-400">{plan.description || 'Ideal para dar el siguiente paso.'}</p>
                                        </div>
                                        
                                        <div className="flex items-baseline gap-1 py-2">
                                            <span className="text-4xl font-black text-slate-100">${plan.price.toLocaleString('es-CL')}</span>
                                            <span className="text-slate-400 text-xs font-medium">/mes</span>
                                        </div>

                                        <ul className="space-y-3.5 pb-6">
                                            {(plan.features || []).map((feature, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <CheckCircle className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${plan.isRecommended ? 'text-cyan-400' : 'text-slate-500'}`} />
                                                    <span className="text-slate-300 text-xs leading-relaxed">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Link 
                                        to="/register" 
                                        className={`
                                            block w-full text-center px-5 py-3.5 text-xs font-bold rounded-xl transition-all 
                                            ${plan.isRecommended 
                                                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:opacity-95 shadow-md hover:shadow-cyan-500/10' 
                                                : 'bg-white/[0.05] border border-white/[0.08] text-slate-200 hover:bg-white/[0.08] hover:border-white/[0.15]'
                                            }
                                        `}
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
            <section className="relative z-10 border-t border-b border-white/[0.06] bg-gradient-to-br from-indigo-950/20 via-[#070913] to-emerald-950/20 py-20 sm:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">{cta.title}</h2>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">{cta.subtitle}</p>
                    <div className="pt-2">
                        <Link 
                            to="/register" 
                            className="
                                inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white 
                                bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-xl
                                shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]
                                hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
                            "
                        >
                            {cta.button}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 bg-[#070913]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="space-y-4">
                            <Logo variant="full" className="h-9 w-auto brightness-0 invert opacity-95" />
                            <p className="text-xs text-slate-500 leading-relaxed">{footer.description}</p>
                        </div>
                        <div>
                            <h4 className="text-slate-200 font-bold mb-4 text-xs tracking-wider uppercase">Producto</h4>
                            <ul className="space-y-3 text-xs">
                                <li><a href="#features" className="text-slate-400 hover:text-cyan-400 transition-colors">Características</a></li>
                                <li><a href="#pricing" className="text-slate-400 hover:text-cyan-400 transition-colors">Precios</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-200 font-bold mb-4 text-xs tracking-wider uppercase">Compañía</h4>
                            <ul className="space-y-3 text-xs">
                                <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Contacto</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Soporte</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-200 font-bold mb-4 text-xs tracking-wider uppercase">Legal</h4>
                            <ul className="space-y-3 text-xs">
                                <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Términos de Servicio</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacidad</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/[0.06] mt-12 pt-8 text-xs text-slate-500 text-center md:text-left flex flex-col md:flex-row justify-between gap-4">
                        <p>© {new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
                        <p className="font-mono text-[10px] tracking-wider text-slate-600">CONEXIÓN SEGURA SSL · CHILE</p>
                    </div>
                </div>
            </footer>
            
            {/* Chatbot Publico */}
            {cfg.chatbot?.enabled && <PublicChatWidget cfg={cfg.chatbot} />}
        </main>
    );
}

