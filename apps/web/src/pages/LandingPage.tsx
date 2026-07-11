import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle, Building2, FileText, Menu, Globe, Truck, ArrowRight, Sparkles,
    AlertTriangle, ChevronDown
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { PublicChatWidget } from '../components/landing/PublicChatWidget';
import { usePublicPlans } from '../hooks/usePublicPlans';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';


interface PainItem { title: string; description: string }
interface UseCaseItem { title: string; description: string }
interface StatItem { label: string; value: string }
interface TestimonialItem { name: string; role: string; content: string }
interface ComparisonRow { feature: string; nexopos: string; excel: string; traditional: string }
interface FaqItem { question: string; answer: string }

interface LandingConfig {
    hero: {
        badge: string; title: string; titleHighlight: string;
        description: string; ctaPrimary: string; ctaSecondary: string; dteBanner: string; image?: string;
    };
    pain: { title: string; subtitle: string; items: PainItem[] };
    solution: { title: string; subtitle: string; description: string; image?: string; };
    features: { sectionTitle: string; sectionSubtitle: string; items: { title: string; description: string }[] };
    useCases: { title: string; subtitle: string; items: UseCaseItem[] };
    stats: { items: StatItem[] };
    testimonials: { items: TestimonialItem[] };
    comparison: { title: string; subtitle: string; rows: ComparisonRow[] };
    pricing: { title: string; subtitle: string };
    faqs: { title: string; subtitle: string; items: FaqItem[] };
    cta: { title: string; subtitle: string; button: string };
    footer: { description: string };
    seo?: { title: string; description: string; keywords: string };
    chatbot?: { enabled: boolean; welcomeMessage: string; options: string[] };
}

const HeroCarousel = () => {
    const images = [
        "/real-pos.webp",
        "/real-dashboard.webp",
        "/real-inventario.webp",
        "/real-tesoreria.webp",
        "/real-store online.webp",
        "/real-historial de ventas.webp"
    ];
    
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className="w-full h-full relative group overflow-hidden bg-black">
            {images.map((img, idx) => (
                <img
                    key={img}
                    src={img}
                    alt={`NexoPOS Interface ${idx}`}
                    className={`
                        absolute inset-0 w-full h-full object-cover object-left-top transition-all duration-1000 ease-in-out
                        ${idx === currentIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'}
                    `}
                />
            ))}
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2 bg-black/60 px-3 py-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-cyan-400 w-4' : 'bg-white/40 hover:bg-white/70'}`}
                    />
                ))}
            </div>
        </div>
    );
};

const DEFAULT_CFG: LandingConfig = {
    hero: {
        badge: 'Software POS · +350 Comercios en Chile · Operando desde 2022',
        title: 'Tu comercio no puede funcionar a ciegas.',
        titleHighlight: 'NexoPOS te devuelve el control total, en tiempo real.',
        description: 'El sistema POS más rápido de Chile. Stock sincronizado al instante, caja sin filas y tu operación completa en un solo panel — desde cualquier dispositivo.',
        ctaPrimary: 'Solicitar Demo Gratuita',
        ctaSecondary: 'Ver el sistema en acción',
        dteBanner: 'Incluye Facturación Electrónica DTE certificada ante el SII, sin costo extra.',
    },
    pain: {
        title: 'Si ya viviste esto, sabes exactamente de lo que hablamos.',
        subtitle: 'EL CAOS QUE QUEMA TU NEGOCIO POR DENTRO',
        items: [
            {
                title: 'La caja que no cuadra nunca',
                description: 'Tu cajero anota las ventas a mano o en una planilla que nadie actualiza al mismo tiempo. Al final del día, los números no cierran — y nunca sabrás si fue un error humano, una venta mal registrada o robo hormiga. Revisas todo de nuevo. Son las 10 de la noche. Sigues en el local.'
            },
            {
                title: 'Vendes lo que no tienes. Pierdes lo que no ves.',
                description: 'Un cliente pide el producto que más te rota. Tú dices que hay stock. Vas a buscarlo a la bodega y no está. ¿Fue vendido sin registrarse? ¿Quedó mal ingresado? No tienes cómo saberlo. El cliente se va. La reputación se daña. El margen se evapora.'
            },
            {
                title: 'Filas que matan ventas y sucursales que operan como islas',
                description: 'Cada segundo de espera en la caja es un cliente que recalcula si vale la pena. Un sistema lento no solo molesta — te cuesta ventas reales. Y lo que pasa en una sucursal no llega a la otra ni al dueño. Descubres los problemas días después, cuando ya no hay solución.'
            }
        ]
    },
    solution: {
        title: 'Un sistema tan rápido como tu comercio. Tan preciso como necesitas.',
        subtitle: 'NEXOPOS — CONTROL TOTAL. SIN CONCESIONES.',
        description: 'NexoPOS fue construido sobre una premisa simple: cada décima de segundo que ahorras en la caja y cada unidad que tu inventario registra correctamente, es dinero que vuelve a tu bolsillo. Una sola plataforma. Un solo dashboard. Cero doble digitación.'
    },
    features: {
        sectionTitle: 'Tres módulos que transforman la forma en que operas.',
        sectionSubtitle: 'Cada funcionalidad fue diseñada para eliminar una fricción específica en el comercio chileno moderno.',
        items: [
            {
                title: '⚡ Caja Hiper-Rápida. Menos de 2 segundos por transacción.',
                description: 'Busca el producto por código de barra, nombre o categoría en milisegundos. El sistema calcula cambios, descuentos y propinas automáticamente. Múltiples métodos de pago en un clic. Funciona offline si cae el internet. Compatible con impresoras térmicas 57mm y 80mm, lectores de barra y gavetas electrónicas.'
            },
            {
                title: '📦 Stock Sincronizado al Instante. En Todos Tus Locales.',
                description: 'Cada vez que un producto sale por la caja — ya sea en tu local físico, tu tienda online o una sucursal a 200 km — el inventario se actualiza en milisegundos en toda la red. Alertas automáticas de stock mínimo. Transferencias entre bodegas con trazabilidad completa. Dashboard en tiempo real desde el celular.'
            },
            {
                title: '🏪 Control Multisucursal. Todo desde un Solo Panel.',
                description: 'Administra múltiples locales sin moverte de tu casa. Visualiza el stock de cada bodega en tiempo real, inspecciona reportes consolidados por sede y detecta descuadres antes de que se conviertan en pérdidas. El control que antes requería presencia física, ahora está en tu pantalla.'
            },
            {
                title: '🌐 Tu Tienda Online Sincronizada con tu Local.',
                description: 'Tu catálogo físico y online comparten el mismo inventario en tiempo real. Si vendes en el local, el stock web baja al instante. Si vendes online, el POS ya sabe que ese producto no está disponible. Sin quiebres de stock. Sin ventas de productos inexistentes. Sin clientes enojados.'
            },
        ],
    },
    useCases: {
        title: 'Diseñado para el comercio real en Chile.',
        subtitle: 'SECTORES COMPATIBLES',
        items: [
            { title: 'Minimarkets y Almacenes', description: 'Lectura ultra rápida de código de barras, control de vencimientos y cierre de caja automatizado. Para el negocio que no puede perder ni un segundo.' },
            { title: 'Ferreterías y Repuestos', description: 'Gestión de miles de SKUs, equivalencias de productos y ventas mayoristas. Tus vendedores encuentran el repuesto correcto en segundos, no en minutos.' },
            { title: 'Tiendas de Retail y Mascotas', description: 'Variantes de productos (talla, color, sabor), control de servicios y promociones dinámicas. Cada producto en su lugar, cada precio correcto.' },
            { title: 'Distribuidoras y Mayoristas', description: 'Módulo de compras robusto, márgenes de ganancia por volumen y control de rutas. Tu bodega siempre abastecida y tus márgenes siempre visibles.' }
        ]
    },
    stats: {
        items: [
            { label: 'Comercios Activos en Chile', value: '+350' },
            { label: 'Transacciones Procesadas', value: '+15 Millones' },
            { label: 'Uptime Garantizado (AWS)', value: '99.98%' }
        ]
    },
    testimonials: {
        items: [
            {
                name: 'Francisco Pérez',
                role: 'Fundador · Almacén Providencia',
                content: 'Antes del fin de semana lo pasábamos cuadrando inventarios a mano entre todos los locales. Era insostenible. Con NexoPOS eso desapareció — el sistema actualiza el stock solo, en tiempo real, y yo lo veo desde el celular mientras estoy en casa. Abrimos 3 sucursales en 12 meses.'
            },
            {
                name: 'Alejandra Fravéga',
                role: 'Gerente de Operaciones · Distribuidora Ponchos del Cachapoal',
                content: 'La velocidad de caja es brutal. Antes hacíamos fila en los momentos peak. Ahora cobramos el doble de rápido y los clientes lo notan. NexoPOS cambió la experiencia de compra de nuestra tienda completamente.'
            }
        ]
    },
    comparison: {
        title: 'NexoPOS vs. Excel y sistemas del pasado',
        subtitle: 'COMPARATIVA OBJETIVA',
        rows: [
            { feature: 'Sincronización de stock en tiempo real', nexopos: 'Sí, 100% instantáneo', excel: 'No (archivos locales aislados)', traditional: 'A veces (servidores lentos)' },
            { feature: 'Velocidad de caja por transacción', nexopos: 'Menos de 2 segundos', excel: 'Lento e ineficiente', traditional: 'Lento, requiere terminales caras' },
            { feature: 'Alertas de stock mínimo automáticas', nexopos: 'Sí, configurables por producto', excel: 'No (revisión manual)', traditional: 'Requiere módulo extra de pago' },
            { feature: 'Soporte técnico en vivo', nexopos: 'WhatsApp directo — respuesta en 15 min', excel: 'Tú lo resuelves solo', traditional: 'Soporte telefónico costoso o ausente' },
            { feature: 'Control multisucursal unificado', nexopos: 'Sí, desde un solo panel', excel: 'No', traditional: 'Requiere instalación en cada local' }
        ]
    },
    pricing: {
        title: 'Planes escalables. Sin contratos. Sin sorpresas.',
        subtitle: 'Elige el plan que soporta tu operación hoy. Escala cuando crezcas. Cancela cuando quieras — sin multas ni costos extras.',
    },
    faqs: {
        title: 'Preguntas frecuentes',
        subtitle: 'Respuestas claras antes de que las necesites.',
        items: [
            { question: '¿El POS funciona si se cae el internet?', answer: 'Sí. El módulo de caja cuenta con modo offline inteligente. Puedes seguir vendiendo y registrando pagos sin conexión. Tan pronto vuelva la señal, los datos se sincronizan automáticamente con la nube sin intervención manual.' },
            { question: '¿Puedo ver el inventario de todas mis sucursales en tiempo real?', answer: 'Sí. Desde el dashboard administrativo puedes ver el stock de cada bodega y sucursal en tiempo real, desde cualquier dispositivo. No necesitas estar físicamente en el local.' },
            { question: '¿Tengo que firmar un contrato de permanencia mínima?', answer: 'No. El servicio se cobra mensualmente y puedes cancelarlo o cambiar de plan en cualquier momento sin multas ni costos de salida.' },
            { question: '¿Puedo importar mis productos desde Excel?', answer: '¡Por supuesto! NexoPOS tiene un importador masivo de productos en Excel. Si tienes dificultades, nuestro equipo de soporte te asiste para migrar toda tu base de datos en menos de 1 hora.' },
            { question: '¿NexoPOS es compatible con lectores de código de barra y gavetas de dinero?', answer: 'Sí, es compatible con el 99% de los hardwares POS USB y Bluetooth del mercado: lectores de código de barra, impresoras térmicas de 57mm y 80mm, y gavetas electrónicas.' },
            { question: '¿Cómo funciona la integración con Shopify y WooCommerce?', answer: 'Conectas tu tienda en un paso con tus credenciales API. Cuando vendes online, el stock baja en el POS de tu local físico. Si vendes en el local, el inventario web se actualiza al instante. Sin doble digitación, sin desfases.' },
            { question: '¿El soporte técnico está incluido en el precio?', answer: 'Sí, todos los planes incluyen soporte técnico. Los planes intermedios y avanzados incluyen canal de WhatsApp prioritario con respuesta garantizada en menos de 15 minutos.' },
            { question: '¿Puedo configurar precios por volumen o precios mayoristas?', answer: 'Sí. NexoPOS te permite configurar escalas de precios por cantidad (precios mayoristas, descuentos por volumen) por cada producto.' },
            { question: '¿Los datos de mi negocio están seguros?', answer: 'Sí. Toda la información viaja encriptada vía SSL y se almacena en servidores AWS de alta disponibilidad con respaldos automatizados cada 6 horas.' },
            { question: '¿Necesito comprar un Certificado Digital para la facturación electrónica?', answer: 'No. NexoPOS incluye la gestión completa de firma digital y folios DTE en el plan. Nos encargamos de enrolar tu empresa ante el SII sin costo adicional.' }
        ]
    },
    cta: {
        title: 'Tu comercio merece un sistema que trabaje tan duro como tú.',
        subtitle: 'Solicita una demo personalizada de 30 minutos. Te mostramos en vivo cómo NexoPOS opera en un comercio como el tuyo — sin términos técnicos, sin presión de venta.',
        button: 'Solicitar Demo Gratuita',
    },
    footer: { description: 'El sistema POS más rápido de Chile. Control total de tu inventario, caja y sucursales en tiempo real.' },
    seo: {
        title: 'NexoPOS | Sistema POS Chile — Control Total de tu Comercio',
        description: 'Software punto de venta líder para PYMES chilenas. Ideal para minimarkets, ferreterías y almacenes. Sincronización de stock en tiempo real y caja ultrarrápida.',
        keywords: 'sistema pos chile, software punto de venta, software para ferreterías, punto de venta minimarket, control inventario tiempo real, sistema ventas pyme chile, software inventario'
    },
    chatbot: {
        enabled: false,
        welcomeMessage: '¡Hola! Soy el asistente de NexoPOS. ¿Tienes alguna pregunta sobre el sistema o quieres agendar una demo gratuita?',
        options: ['Quiero una Demo', 'Ver Planes y Precios', 'Soporte Técnico']
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
        } else if (Array.isArray(override[key]) && override[key].length === 0) {
            // Fallback to base array if the override array is empty (e.g. no items added in admin)
            result[key] = base[key] || [];
        } else if (override[key] !== undefined && override[key] !== null && override[key] !== '') {
            result[key] = override[key];
        }
    }
    return result;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 transition-all hover:bg-white/[0.02]">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center text-left text-slate-100 hover:text-cyan-300 transition-colors"
            >
                <span className="text-sm sm:text-base font-bold">{question}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180 text-cyan-400' : ''}`} />
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{answer}</p>
            </div>
        </div>
    );
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
    const { hero, pain, solution, features, useCases, stats, testimonials, comparison, pricing, faqs, cta, footer, seo } = cfg;

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
        <main className="dark min-h-screen bg-[#070913] text-slate-100 font-sans relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
            {/* Fine tech grid background overlay */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-40" 
                style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Glowing backdrop orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute top-[30%] right-[-10%] w-[55%] h-[55%] rounded-full bg-emerald-500/8 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

            {/* Navigation Header */}
            <nav className="fixed w-full bg-[#070913]/60 backdrop-blur-xl z-50 border-b border-white/[0.06] transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <Logo variant="full" className="h-9 w-auto brightness-0 invert opacity-95" />
                        </Link>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Características</a>
                            <a href="#use-cases" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Casos</a>
                            <a href="#comparison" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Comparativa</a>
                            <a href="#pricing" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Precios</a>
                            <a href="#faqs" className="text-slate-300 hover:text-cyan-400 font-medium text-sm transition-colors duration-200">Preguntas</a>
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
                    <div className="md:hidden bg-[#0d1226]/95 border-b border-white/[0.08] px-4 pt-2 pb-6 space-y-3 shadow-2xl absolute w-full backdrop-blur-xl z-50">
                        <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Características</a>
                        <a href="#use-cases" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Casos</a>
                        <a href="#comparison" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Comparativa</a>
                        <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Precios</a>
                        <a href="#faqs" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium py-2 px-3 rounded-lg hover:bg-white/[0.04]">Preguntas</a>
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
            <section className="relative pt-20 lg:pt-36 pb-16 lg:pb-32 z-10" style={{
                backgroundImage: 'url(/hero-bg-store.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>
                <div className="absolute inset-0 bg-[#070913]/85 backdrop-blur-[2px] z-0"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Hero Text */}
                        <div className="max-w-2xl text-center lg:text-left space-y-6">
                            {/* Glowing Badge */}
                            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase">
                                <Sparkles className="w-3.5 h-3.5" />
                                {hero.badge}
                            </div>
                            
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
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
                                        w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white 
                                        bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-xl
                                        shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]
                                        hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
                                    "
                                >
                                    {hero.ctaPrimary}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                                <a 
                                    href="#pricing" 
                                    className="
                                        w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-slate-200 
                                        bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] 
                                        hover:border-white/[0.15] transition-all duration-200
                                    "
                                >
                                    {hero.ctaSecondary}
                                </a>
                            </div>

                            {/* DTE Notice Banner */}
                            <div className="hidden md:inline-flex items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm text-slate-400 bg-white/[0.02] border border-white/[0.06] py-3 px-5 rounded-2xl shadow-inner backdrop-blur-md">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: hero.dteBanner.replace('Facturación Electrónica DTE', '<strong class="text-cyan-300 font-bold">Facturación Electrónica DTE</strong>') }} />
                            </div>
                        </div>

                        {/* Hero Demo Graphic */}
                        <div className="relative mt-10 lg:mt-0 block">
                            {/* Glowing light background backing */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 rounded-2xl blur-3xl opacity-30"></div>
                            
                            {/* Outer Glass Card */}
                            <div className="relative rounded-2xl bg-[#0a0a0a] border border-white/[0.15] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden aspect-video flex flex-col backdrop-blur-xl">
                                <div className="h-9 border-b border-white/[0.08] bg-[#1a1b1e] flex items-center px-4 space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="flex-1 bg-black relative">
                                    <HeroCarousel />
                                    <div className="hidden absolute inset-0 m-4 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-slate-400">
                                        <Building2 className="w-12 h-12 mb-3 opacity-40 text-cyan-400" />
                                        <p className="font-semibold text-sm tracking-wide text-slate-200">Plataforma B2B Unificada</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </section>

            {/* Pain Points Section */}
            {pain && (
                <section id="pain" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05] bg-gradient-to-b from-[#070913] to-slate-950/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
                            {pain.subtitle && (
                                <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                                    {pain.subtitle}
                                </span>
                            )}
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                                {pain.title}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                            {(pain.items || []).map((item, i) => (
                                <div 
                                    key={i} 
                                    className="p-8 rounded-3xl bg-gradient-to-b from-red-950/20 to-black/40 border border-red-500/10 hover:border-red-500/30 backdrop-blur-xl transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(220,38,38,0.15)] flex flex-col"
                                >
                                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 group-hover:bg-red-500/20">
                                        <AlertTriangle className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-4 tracking-tight leading-snug">{item.title}</h3>
                                    <p className="text-red-200/60 leading-relaxed text-sm flex-1">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Solution Section */}
            {solution && (
                <section id="solution" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05] bg-slate-950/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            {/* Visual Graphic Mockup */}
                            <div className="relative order-2 lg:order-1">
                                <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-2xl blur-3xl opacity-40"></div>
                                <div className="relative rounded-2xl bg-[#0a0a0a] border border-white/[0.15] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden aspect-video flex flex-col backdrop-blur-xl">
                                    <div className="h-9 border-b border-white/[0.08] bg-[#1a1b1e] flex items-center px-4 space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div className="flex-1 bg-black relative">
                                        <img 
                                            src={solution.image || "/real-dashboard.webp"} 
                                            alt="Panel de Control NexoPOS" 
                                            className="w-full h-full object-cover object-left-top"
                                            onError={e => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                        <div className="hidden absolute inset-0 m-4 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-slate-400">
                                            <Building2 className="w-12 h-12 mb-3 opacity-40 text-cyan-400" />
                                            <p className="font-semibold text-sm text-slate-200">Panel Control Operativo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Solution Text */}
                            <div className="space-y-6 order-1 lg:order-2">
                                {solution.subtitle && (
                                    <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                                        {solution.subtitle}
                                    </span>
                                )}
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                                    {solution.title}
                                </h2>
                                <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                                    {solution.description}
                                </p>
                                <div className="pt-2">
                                    <Link 
                                        to="/register" 
                                        className="
                                            w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white 
                                            bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl
                                            hover:opacity-95 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:scale-[1.02] transition-all duration-200
                                        "
                                    >
                                        Conocer más funciones
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section id="features" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                            {features.sectionTitle}
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                            {features.sectionSubtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {(features.items || []).map((item, i) => {
                            const { icon: Icon, color, bg, border, hover } = FEATURE_ICONS[i] ?? FEATURE_ICONS[0];
                            const isLarge = i === 0 || i === 3; // Make 1st and 4th items large
                            const bentoImages = ['/real-pos.webp', '/real-inventario.webp', '/real-tesoreria.webp', '/real-store online.webp'];
                            
                            return (
                                <div 
                                    key={i} 
                                    className={`
                                        relative overflow-hidden p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-white/[0.08] 
                                        ${hover} backdrop-blur-xl transition-all duration-300 group hover:-translate-y-1
                                        flex flex-col justify-between min-h-[360px]
                                        ${isLarge ? 'md:col-span-2' : 'md:col-span-1'}
                                    `}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10">
                                        <div 
                                            className={`
                                                w-12 h-12 ${bg} ${border} border rounded-2xl flex items-center justify-center mb-6 
                                                group-hover:scale-110 transition-transform duration-300
                                            `}
                                        >
                                            <Icon className={`w-6 h-6 ${color}`} />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{item.title}</h3>
                                        <p className="text-slate-400 leading-relaxed text-sm">{item.description}</p>
                                    </div>
                                    
                                    {/* Mockup decoration for bento boxes */}
                                    <div className={`relative mt-8 -mx-8 -mb-8 ${isLarge ? 'h-64' : 'h-48'} overflow-hidden border-t border-white/[0.08] bg-black/40`}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10 pointer-events-none"></div>
                                        <img src={bentoImages[i] || bentoImages[0]} alt={item.title} className="w-full h-full object-cover object-top opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 group-hover:translate-y-2" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            {useCases && (
                <section id="use-cases" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05] bg-[#070913]/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
                            {useCases.subtitle && (
                                <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    {useCases.subtitle}
                                </span>
                            )}
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                                {useCases.title}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                            {(useCases.items || []).map((item, i) => (
                                <div 
                                    key={i} 
                                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/20 hover:bg-[#0d1226]/20 backdrop-blur-md transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mb-5">
                                            <Building2 className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-100 mb-2">{item.title}</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Stats & Testimonials Section */}
            {((stats && stats.items && stats.items.length > 0) || (testimonials && testimonials.items && testimonials.items.length > 0)) && (
                <section id="proof" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05] bg-gradient-to-b from-[#070913] to-slate-950/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Stats grid */}
                        {stats && stats.items && stats.items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12 md:mb-20">
                                {stats.items.map((stat, i) => (
                                    <div key={i} className="p-6 md:p-8 rounded-3xl bg-white/[0.01] border border-white/[0.05] backdrop-blur-md text-center">
                                        <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                                            {stat.value}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Testimonials */}
                        {testimonials && testimonials.items && testimonials.items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                {testimonials.items.map((testimonial, i) => (
                                    <div key={i} className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between relative">
                                        {/* Quotation icon decoration */}
                                        <div className="absolute top-6 right-8 text-foreground/[0.02] text-7xl font-serif pointer-events-none">“</div>
                                        <p className="text-slate-300 leading-relaxed text-sm italic relative z-10 mb-6">
                                            "{testimonial.content}"
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                {testimonial.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-100">{testimonial.name}</h4>
                                                <p className="text-xs text-slate-500">{testimonial.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Visual Comparison Section */}
            {comparison && comparison.rows && comparison.rows.length > 0 && (
                <section id="comparison" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05] bg-[#070913]/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
                            {comparison.subtitle && (
                                <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                                    {comparison.subtitle}
                                </span>
                            )}
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                                {comparison.title}
                            </h2>
                        </div>
                        <div className="max-w-4xl mx-auto overflow-x-auto rounded-3xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-md">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.08] bg-slate-950/40">
                                        <th className="p-3 sm:p-5 font-bold text-slate-300 uppercase tracking-wider">Característica</th>
                                        <th className="p-3 sm:p-5 font-bold text-cyan-400 uppercase tracking-wider">NexoPOS Cloud</th>
                                        <th className="p-3 sm:p-5 font-bold text-slate-400 uppercase tracking-wider">Excel / Planillas</th>
                                        <th className="p-3 sm:p-5 font-bold text-slate-400 uppercase tracking-wider">Sistemas Tradicionales</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {comparison.rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-3 sm:p-5 font-bold text-slate-200">{row.feature}</td>
                                            <td className="p-3 sm:p-5 font-semibold text-cyan-300">{row.nexopos}</td>
                                            <td className="p-3 sm:p-5 text-slate-400">{row.excel}</td>
                                            <td className="p-3 sm:p-5 text-slate-400">{row.traditional}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* Pricing Section */}
            <section id="pricing" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">{pricing.title}</h2>
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
                                        rounded-3xl p-6 sm:p-8 relative flex flex-col justify-between backdrop-blur-md transition-all duration-300 
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

            {/* FAQ Accordion Section */}
            {faqs && faqs.items && faqs.items.length > 0 && (
                <section id="faqs" className="py-16 md:py-24 lg:py-32 relative z-10 border-t border-white/[0.05] bg-gradient-to-b from-[#070913] to-slate-950/30">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10 md:mb-16 space-y-4">
                            {faqs.subtitle && (
                                <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                                    {faqs.subtitle}
                                </span>
                            )}
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">{faqs.title}</h2>
                        </div>
                        <div className="space-y-4">
                            {faqs.items.map((item, i) => (
                                <FAQItem key={i} question={item.question} answer={item.answer} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Final */}
            <section className="relative z-10 border-t border-b border-white/[0.06] bg-gradient-to-br from-indigo-950/20 via-[#070913] to-emerald-950/20 py-16 sm:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">{cta.title}</h2>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">{cta.subtitle}</p>
                    <div className="pt-2">
                        <Link 
                            to="/register" 
                            className="
                                w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white 
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
                                <li><Link to="/contacto" className="text-slate-400 hover:text-cyan-400 transition-colors">Contacto</Link></li>
                                <li><Link to="/soporte" className="text-slate-400 hover:text-cyan-400 transition-colors">Soporte</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-200 font-bold mb-4 text-xs tracking-wider uppercase">Legal</h4>
                            <ul className="space-y-3 text-xs">
                                <li><Link to="/terminos" className="text-slate-400 hover:text-cyan-400 transition-colors">Términos de Servicio</Link></li>
                                <li><Link to="/privacidad" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacidad</Link></li>
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

