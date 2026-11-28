import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Menu, X, ArrowRight } from 'lucide-react';
import '../components/landing/public-site.css';
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

const legacyCopy: Record<string, string> = {"Tu comercio no puede funcionar a ciegas.":"Ventas e inventario","NexoPOS te devuelve el control total, en tiempo real.":"bajo una misma gestión.","El sistema POS más rápido de Chile. Stock sincronizado al instante, caja sin filas y tu operación completa en un solo panel — desde cualquier dispositivo.":"Centraliza el punto de venta, el inventario y tus sucursales. Consulta la operación de tu empresa y toma decisiones con información actualizada.","Solicitar Demo Gratuita":"Comenzar prueba gratuita","Ver el sistema en acción":"Conocer la plataforma","Si ya viviste esto, sabes exactamente de lo que hablamos.":"Visibilidad para la operación diaria.","La caja que no cuadra nunca":"Seguimiento de caja","Vendes lo que no tienes. Pierdes lo que no ves.":"Disponibilidad de productos","Filas que matan ventas y sucursales que operan como islas":"Coordinación entre sucursales","Un sistema tan rápido como tu comercio. Tan preciso como necesitas.":"Las herramientas de tu comercio, conectadas.","NexoPOS fue construido sobre una premisa simple: cada décima de segundo que ahorras en la caja y cada unidad que tu inventario registra correctamente, es dinero que vuelve a tu bolsillo. Una sola plataforma. Un solo dashboard. Cero doble digitación.":"Registra ventas, revisa existencias y consulta los movimientos de cada sucursal desde un entorno de trabajo compartido.","⚡ Caja Hiper-Rápida. Menos de 2 segundos por transacción.":"Punto de venta","📦 Stock Sincronizado al Instante. En Todos Tus Locales.":"Inventario y trazabilidad","🏪 Control Multisucursal. Todo desde un Solo Panel.":"Administración de sucursales","🌐 Tu Tienda Online Sincronizada con tu Local.":"Catálogo y tienda online","Planes escalables. Sin contratos. Sin sorpresas.":"Un plan para cada operación.","NexoPOS vs. Excel y sistemas del pasado":"Funciones de la plataforma"};

const DEFAULT_CFG: LandingConfig = {
    hero: {
        badge: 'Software POS · +350 Comercios en Chile · Operando desde 2022',
        title: 'Ventas e inventario',
        titleHighlight: 'bajo una misma gestión.',
        description: 'Centraliza el punto de venta, el inventario y tus sucursales. Consulta la operación de tu empresa y toma decisiones con información actualizada.',
        ctaPrimary: 'Comenzar prueba gratuita',
        ctaSecondary: 'Conocer la plataforma',
        dteBanner: 'Incluye Facturación Electrónica DTE certificada ante el SII, sin costo extra.',
    },
    pain: {
        title: 'Visibilidad para la operación diaria.',
        subtitle: 'EL CAOS QUE QUEMA TU NEGOCIO POR DENTRO',
        items: [
            {
                title: 'Seguimiento de caja',
                description: 'Tu cajero anota las ventas a mano o en una planilla que nadie actualiza al mismo tiempo. Al final del día, los números no cierran — y nunca sabrás si fue un error humano, una venta mal registrada o robo hormiga. Revisas todo de nuevo. Son las 10 de la noche. Sigues en el local.'
            },
            {
                title: 'Disponibilidad de productos',
                description: 'Un cliente pide el producto que más te rota. Tú dices que hay stock. Vas a buscarlo a la bodega y no está. ¿Fue vendido sin registrarse? ¿Quedó mal ingresado? No tienes cómo saberlo. El cliente se va. La reputación se daña. El margen se evapora.'
            },
            {
                title: 'Coordinación entre sucursales',
                description: 'Cada segundo de espera en la caja es un cliente que recalcula si vale la pena. Un sistema lento no solo molesta — te cuesta ventas reales. Y lo que pasa en una sucursal no llega a la otra ni al dueño. Descubres los problemas días después, cuando ya no hay solución.'
            }
        ]
    },
    solution: {
        title: 'Las herramientas de tu comercio, conectadas.',
        subtitle: 'NEXOPOS — CONTROL TOTAL. SIN CONCESIONES.',
        description: 'Registra ventas, revisa existencias y consulta los movimientos de cada sucursal desde un entorno de trabajo compartido.'
    },
    features: {
        sectionTitle: 'Tres módulos que transforman la forma en que operas.',
        sectionSubtitle: 'Cada funcionalidad fue diseñada para eliminar una fricción específica en el comercio chileno moderno.',
        items: [
            {
                title: 'Punto de venta',
                description: 'Busca productos por código, nombre o categoría. Con el catálogo guardado y un turno abierto, la caja puede seguir registrando ventas y pagos recibidos durante un corte. Compatible con impresoras térmicas, lectores de barra y gavetas electrónicas.'
            },
            {
                title: 'Inventario y trazabilidad',
                description: 'Cada vez que un producto sale por la caja — ya sea en tu local físico, tu tienda online o una sucursal a 200 km — el inventario se actualiza en milisegundos en toda la red. Alertas automáticas de stock mínimo. Transferencias entre bodegas con trazabilidad completa. Dashboard en tiempo real desde el celular.'
            },
            {
                title: 'Administración de sucursales',
                description: 'Administra múltiples locales sin moverte de tu casa. Visualiza el stock de cada bodega en tiempo real, inspecciona reportes consolidados por sede y detecta descuadres antes de que se conviertan en pérdidas. El control que antes requería presencia física, ahora está en tu pantalla.'
            },
            {
                title: 'Catálogo y tienda online',
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
        title: 'Funciones de la plataforma',
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
        title: 'Un plan para cada operación.',
        subtitle: 'Elige el plan que soporta tu operación hoy. Escala cuando crezcas. Cancela cuando quieras — sin multas ni costos extras.',
    },
    faqs: {
        title: 'Preguntas frecuentes',
        subtitle: 'Respuestas claras antes de que las necesites.',
        items: [
            { question: '¿El POS funciona si se cae el internet?', answer: 'Sí. Con un turno abierto y el catálogo guardado, el POS registra efectivo o pagos ya confirmados por otro medio. Las ventas se conservan en este equipo y se sincronizan automáticamente al volver la conexión o al reabrir la caja. Si la facturación está habilitada, ingresa la referencia del documento ya emitido por contingencia.' },
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
        button: 'Comenzar prueba gratuita',
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


function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key of Object.keys(override ?? {})) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
            result[key] = deepMerge(base[key] ?? {}, override[key]);
        } else if (Array.isArray(override[key]) && override[key].length === 0) {
            // Fallback to base array if the override array is empty (e.g. no items added in admin)
            result[key] = base[key] || [];
        } else if (override[key] !== undefined && override[key] !== null && override[key] !== '') {
            result[key] = typeof override[key] === 'string' ? (legacyCopy[override[key]] ?? override[key]) : override[key];
        }
    }
    return result;
}

function cleanHeading(value: string) {
    return (legacyCopy[value] ?? value).replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: plans, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = usePublicPlans();

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
        <div className="public-site">
            <header className="public-header">
                <div className="public-container public-header-inner">
                    <Link to="/landing" className="public-brand" aria-label="NexoPOS, inicio">
                        <Logo variant="full" mode="light" className="h-10 w-auto" />
                    </Link>
                    <nav aria-label="Navegación principal" className="public-header-links desktop">
                        <a href="#features">Producto</a>
                        <a href="#use-cases">Sectores</a>
                        <a href="#pricing">Planes</a>
                        <a href="#faqs">Preguntas frecuentes</a>
                        <Link to="/login">Iniciar sesión</Link>
                        <Link to="/register" className="public-button">Comenzar prueba</Link>
                    </nav>
                    <button type="button" aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={isMenuOpen} aria-controls="landing-mobile-menu" className="public-mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
                {isMenuOpen && (
                    <nav id="landing-mobile-menu" aria-label="Menú móvil" className="public-container public-mobile-nav">
                        <a href="#features" onClick={() => setIsMenuOpen(false)}>Producto</a>
                        <a href="#use-cases" onClick={() => setIsMenuOpen(false)}>Sectores</a>
                        <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Planes</a>
                        <a href="#faqs" onClick={() => setIsMenuOpen(false)}>Preguntas frecuentes</a>
                        <Link to="/login">Iniciar sesión</Link>
                        <Link to="/register" className="public-button">Comenzar prueba</Link>
                    </nav>
                )}
            </header>
            <main>
                <section className="public-hero">
                    <div className="public-container public-hero-grid">
                        <div>
                            <p className="public-eyebrow">Gestión comercial para empresas</p>
                            <h1>{hero.title} <span>{hero.titleHighlight}</span></h1>
                            <p className="public-copy">{hero.description}</p>
                            <div className="public-actions">
                                <Link to="/register" className="public-button">{hero.ctaPrimary}<ArrowRight size={16} aria-hidden="true" /></Link>
                                <a href="#solution" className="public-button secondary">{hero.ctaSecondary}</a>
                            </div>
                        </div>
                        <figure className="public-preview">
                            <img src={hero.image || '/real-inventario.webp'} alt="Inventario y gestión de productos en NexoPOS" fetchPriority="high" width="1200" height="750" />
                            <figcaption>Ventas, inventario y sucursales en una misma plataforma.</figcaption>
                        </figure>
                    </div>
                </section>

                <section id="solution" className="public-section">
                    <div className="public-container">
                        <div className="public-section-intro">
                            <h2>{solution.title}</h2>
                            <p className="public-copy">{solution.description}</p>
                        </div>
                        {solution.image && <figure className="public-preview"><img src={solution.image} alt="Panel de gestión de NexoPOS" loading="lazy" /></figure>}
                        <div id="features" className="public-grid two" style={{ scrollMarginTop: 24 }}>
                            {features.items.map((item, i) => <article key={i} className="public-feature">
                                <h3>{cleanHeading(item.title)}</h3>
                                <p>{item.description}</p>
                            </article>)}
                        </div>
                    </div>
                </section>

                <section id="use-cases" className="public-section soft">
                    <div className="public-container">
                        <div className="public-section-intro"><h2>{useCases.title}</h2></div>
                        <div className="public-grid two">
                            {useCases.items.map((item, i) => <article key={i} className="public-card"><h3>{item.title}</h3><p>{item.description}</p></article>)}
                        </div>
                    </div>
                </section>

                {pain.items.length > 0 && <section className="public-section">
                    <div className="public-container">
                        <div className="public-section-intro"><h2>{pain.title}</h2></div>
                        <div className="public-grid">{pain.items.map((item, i) => <article key={i} className="public-feature"><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
                    </div>
                </section>}

                {comparison.rows.length > 0 && <section id="comparison" className="public-section soft">
                    <div className="public-container">
                        <div className="public-section-intro"><h2>{comparison.title}</h2></div>
                        <div className="public-table-wrap" tabIndex={0} role="region" aria-label="Comparativa de funcionalidades">
                            <table className="public-table">
                                <thead><tr><th scope="col">Funcionalidad</th><th scope="col">NexoPOS</th><th scope="col">Planillas</th><th scope="col">Sistemas tradicionales</th></tr></thead>
                                <tbody>{comparison.rows.map((row, i) => <tr key={i}><th scope="row">{row.feature}</th><td>{row.nexopos}</td><td>{row.excel}</td><td>{row.traditional}</td></tr>)}</tbody>
                            </table>
                        </div>
                    </div>
                </section>}

                <section id="pricing" className="public-section">
                    <div className="public-container">
                        <div className="public-section-intro"><h2>{pricing.title}</h2><p className="public-copy">{pricing.subtitle}</p></div>
                        {plansLoading ? <p role="status">Cargando planes…</p> : plansError ? (
                            <div role="alert"><p>No se pudieron cargar los planes.</p><button className="public-button secondary" onClick={() => void refetchPlans()}>Reintentar</button></div>
                        ) : plans?.length ? <div className="public-grid">
                            {plans.map(plan => <article key={plan.id} className={`public-card public-plan ${plan.isRecommended ? 'recommended' : ''}`}>
                                <div>{plan.isRecommended && <p className="public-plan-tag">Plan recomendado</p>}<h3>{plan.name}</h3>{plan.description && <p>{plan.description}</p>}</div>
                                <div className="public-price">${plan.price.toLocaleString('es-CL')} <small>/ mes</small></div>
                                <ul>{(plan.features || []).map((feature, i) => <li key={i}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
                                <Link to="/register" className={`public-button ${plan.isRecommended ? '' : 'secondary'}`}>Elegir plan</Link>
                            </article>)}
                        </div> : <p className="public-copy">Consulta los planes disponibles a través de <Link to="/contacto">nuestro equipo</Link>.</p>}
                    </div>
                </section>

                {stats.items.length > 0 && <div className="public-container public-stats">{stats.items.map((item, i) => <div key={i}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>}
                {testimonials.items.length > 0 && <section className="public-section soft"><div className="public-container public-grid two">
                    {testimonials.items.map((item, i) => <figure key={i} className="public-card public-quote"><blockquote>{item.content}</blockquote><figcaption><strong>{item.name}</strong>{item.role}</figcaption></figure>)}
                </div></section>}

                <section id="faqs" className="public-section">
                    <div className="public-container">
                        <div className="public-section-intro"><h2>{faqs.title}</h2></div>
                        {faqs.items.map((item, i) => <details key={i} className="public-faq"><summary>{item.question}</summary><p>{item.answer}</p></details>)}
                    </div>
                </section>
                <section className="public-section public-cta">
                    <div className="public-container"><h2>{cta.title}</h2><p className="public-copy">{cta.subtitle}</p><div className="public-actions"><Link to="/register" className="public-button">{cta.button}<ArrowRight size={16} aria-hidden="true" /></Link></div></div>
                </section>
            </main>
            <footer className="public-footer">
                <div className="public-container">
                    <div className="public-footer-top">
                        <div><Link to="/landing" className="public-brand" aria-label="NexoPOS, inicio"><Logo variant="full" mode="light" className="h-10 w-auto" /></Link><p>{footer.description}</p></div>
                        <nav aria-label="Enlaces de contacto y legales" className="public-footer-links">
                            <Link to="/contacto">Contacto</Link><Link to="/soporte">Soporte</Link><Link to="/terminos">Términos</Link><Link to="/privacidad">Privacidad</Link>
                        </nav>
                    </div>
                    <div className="public-footer-bottom">© {new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</div>
                </div>
            </footer>
            {cfg.chatbot?.enabled && <PublicChatWidget cfg={cfg.chatbot} />}
        </div>
    );
}
