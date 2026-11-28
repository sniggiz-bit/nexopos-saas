import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Menu, X, ArrowRight, ShoppingCart, Package, Store, FileSpreadsheet, Wallet, BarChart3, LayoutGrid, type LucideIcon } from 'lucide-react';
import '../components/landing/public-site.css';
import { Logo } from '../components/ui/Logo';
import { PublicChatWidget } from '../components/landing/PublicChatWidget';
import { usePublicPlans } from '../hooks/usePublicPlans';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { routeSeo, structuredData } from '../lib/seo';
import { applyPageSeo } from '../lib/seo-dom';


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

const legacyCopy: Record<string, string> = {
    "Software POS · +350 Comercios en Chile · Operando desde 2022": "15 días de prueba gratis",
    "Ventas e inventario": "Vende con más tranquilidad.",
    "bajo una misma gestión.": "Ten tu negocio bajo control.",
    "Centraliza el punto de venta, el inventario y tus sucursales. Consulta la operación de tu empresa y toma decisiones con información actualizada.": "Un sistema POS para tu almacén, botillería, minimarket o tienda. Cobra, controla tu stock y revisa cómo va tu negocio desde un mismo lugar.",
    "Comenzar prueba gratuita": "Comenzar mis 15 días gratis",
    "Conocer la plataforma": "",
    "Incluye Facturación Electrónica DTE certificada ante el SII, sin costo extra.": "",
    "Visibilidad para la operación diaria.": "Menos dudas al cerrar. Más claridad para mañana.",
    "EL CAOS QUE QUEMA TU NEGOCIO POR DENTRO": "Tu día a día, más simple",
    "Seguimiento de caja": "¿Cuánto vendiste hoy?",
    "Tu cajero anota las ventas a mano o en una planilla que nadie actualiza al mismo tiempo. Al final del día, los números no cierran — y nunca sabrás si fue un error humano, una venta mal registrada o robo hormiga. Revisas todo de nuevo. Son las 10 de la noche. Sigues en el local.": "Consulta tus ventas y métodos de pago sin reunir anotaciones al final de la jornada. Revisa lo que pasó en caja con los movimientos a la vista.",
    "Disponibilidad de productos": "¿Qué necesitas reponer?",
    "Un cliente pide el producto que más te rota. Tú dices que hay stock. Vas a buscarlo a la bodega y no está. ¿Fue vendido sin registrarse? ¿Quedó mal ingresado? No tienes cómo saberlo. El cliente se va. La reputación se daña. El margen se evapora.": "Revisa las existencias y las alertas de stock mínimo para preparar tus compras. Así puedes anticiparte cuando un producto comienza a escasear.",
    "Coordinación entre sucursales": "¿Cómo va tu otro local?",
    "Cada segundo de espera en la caja es un cliente que recalcula si vale la pena. Un sistema lento no solo molesta — te cuesta ventas reales. Y lo que pasa en una sucursal no llega a la otra ni al dueño. Descubres los problemas días después, cuando ya no hay solución.": "Consulta el stock por sucursal y revisa los movimientos desde tu panel. Mantén una visión de tu negocio a medida que crece.",
    "Las herramientas de tu comercio, conectadas.": "Atiende a tus clientes. NexoPOS te ayuda con el control.",
    "NEXOPOS — CONTROL TOTAL. SIN CONCESIONES.": "Las funciones que usas todos los días",
    "Registra ventas, revisa existencias y consulta los movimientos de cada sucursal desde un entorno de trabajo compartido.": "Desde la primera venta de la mañana hasta el cierre de caja. Conecta las tareas de tu local para dedicar menos tiempo a buscar información y más a tu negocio.",
    "Tres módulos que transforman la forma en que operas.": "Lo que necesitas para vender y ordenar tu negocio.",
    "Cada funcionalidad fue diseñada para eliminar una fricción específica en el comercio chileno moderno.": "Herramientas prácticas, con beneficios que se notan en el día a día.",
    "Punto de venta": "Punto de venta · Cobra con todo a mano",
    "Busca productos por código, nombre o categoría. Con el catálogo guardado y un turno abierto, la caja puede seguir registrando ventas y pagos recibidos durante un corte. Compatible con impresoras térmicas, lectores de barra y gavetas electrónicas.": "Encuentra productos por nombre o código de barras y registra distintos medios de pago. Atiende desde un catálogo ordenado y consulta el total antes de cobrar.",
    "Inventario y trazabilidad": "Inventario · Sabe qué tienes para vender",
    "Cada vez que un producto sale por la caja — ya sea en tu local físico, tu tienda online o una sucursal a 200 km — el inventario se actualiza en milisegundos en toda la red. Alertas automáticas de stock mínimo. Transferencias entre bodegas con trazabilidad completa. Dashboard en tiempo real desde el celular.": "Consulta existencias, alertas de stock mínimo e historial de movimientos. Prepara la reposición con información de lo que entra y sale de tu negocio.",
    "Administración de sucursales": "Sucursales · Crece sin perder de vista tu stock",
    "Administra múltiples locales sin moverte de tu casa. Visualiza el stock de cada bodega en tiempo real, inspecciona reportes consolidados por sede y detecta descuadres antes de que se conviertan en pérdidas. El control que antes requería presencia física, ahora está en tu pantalla.": "Revisa las existencias por local y registra traspasos entre sucursales. Ubica la mercadería disponible cuando necesitas abastecer otro punto de venta.",
    "Catálogo y tienda online": "Excel · Comienza con tus propios productos",
    "Tu catálogo físico y online comparten el mismo inventario en tiempo real. Si vendes en el local, el stock web baja al instante. Si vendes online, el POS ya sabe que ese producto no está disponible. Sin quiebres de stock. Sin ventas de productos inexistentes. Sin clientes enojados.": "Importa tu catálogo con una plantilla Excel y organiza productos por categoría, marca y código. Ahorra la carga manual de cada artículo para comenzar a trabajar.",
    "Diseñado para el comercio real en Chile.": "Un POS para tu forma de vender.",
    "SECTORES COMPATIBLES": "Comercios de Chile",
    "Minimarkets y Almacenes": "Almacenes y minimarkets",
    "Lectura ultra rápida de código de barras, control de vencimientos y cierre de caja automatizado. Para el negocio que no puede perder ni un segundo.": "Encuentra productos por código de barras, registra las ventas del día y revisa lo que queda en bodega. Ten más información para tu próxima reposición.",
    "Ferreterías y Repuestos": "Botillerías",
    "Gestión de miles de SKUs, equivalencias de productos y ventas mayoristas. Tus vendedores encuentran el repuesto correcto en segundos, no en minutos.": "Organiza bebidas y otros productos por categoría y marca. Consulta precios y existencias al atender, y revisa los pagos cuando termina el turno.",
    "Tiendas de Retail y Mascotas": "Tiendas de ropa y accesorios",
    "Variantes de productos (talla, color, sabor), control de servicios y promociones dinámicas. Cada producto en su lugar, cada precio correcto.": "Identifica cada artículo con su propio código y organiza tu catálogo por categorías. Consulta lo disponible para atender a cada cliente con información a mano.",
    "Distribuidoras y Mayoristas": "Ferreterías, bazares y otros locales",
    "Módulo de compras robusto, márgenes de ganancia por volumen y control de rutas. Tu bodega siempre abastecida y tus márgenes siempre visibles.": "Ordena un catálogo amplio por nombre, SKU o código de barras. Ubica los productos, controla movimientos y revisa las ventas desde el mismo sistema.",
    "Funciones de la plataforma": "",
    "COMPARATIVA OBJETIVA": "",
    "Un plan para cada operación.": "Primero conócelo. Después elige tu plan.",
    "Elige el plan que soporta tu operación hoy. Escala cuando crezcas. Cancela cuando quieras — sin multas ni costos extras.": "Comienza con 15 días de prueba gratis. Revisa las funciones de cada plan y elige el que se ajuste al tamaño y las necesidades de tu negocio.",
    "Preguntas frecuentes": "Antes de empezar, resolvamos tus dudas.",
    "Respuestas claras antes de que las necesites.": "Preguntas frecuentes",
    "¿Puedo ver el inventario de todas mis sucursales en tiempo real?": "¿Me sirve si tengo un solo local?",
    "Sí. Desde el dashboard administrativo puedes ver el stock de cada bodega y sucursal en tiempo real, desde cualquier dispositivo. No necesitas estar físicamente en el local.": "Sí. Puedes comenzar con tu local y organizar ventas, productos y caja desde el mismo sistema. Si después abres otra sucursal, revisa el plan que se adapte a esa etapa.",
    "¿Tengo que firmar un contrato de permanencia mínima?": "¿Cómo comienzo los 15 días de prueba gratis?",
    "No. El servicio se cobra mensualmente y puedes cancelarlo o cambiar de plan en cualquier momento sin multas ni costos de salida.": "Crea tu cuenta desde el botón de prueba gratuita, registra los datos de tu negocio y comienza a explorar NexoPOS. Tendrás 15 días para conocer el punto de venta y las herramientas de gestión.",
    "¡Por supuesto! NexoPOS tiene un importador masivo de productos en Excel. Si tienes dificultades, nuestro equipo de soporte te asiste para migrar toda tu base de datos en menos de 1 hora.": "Sí. Descarga la plantilla e importa tu catálogo desde Excel. Puedes revisar el resultado de la carga y corregir las filas que lo necesiten.",
    "¿NexoPOS es compatible con lectores de código de barra y gavetas de dinero?": "¿Puedo usar lector de código de barras e impresora?",
    "Sí, es compatible con el 99% de los hardwares POS USB y Bluetooth del mercado: lectores de código de barra, impresoras térmicas de 57mm y 80mm, y gavetas electrónicas.": "NexoPOS permite trabajar con lectores de códigos de barras e impresión de comprobantes. Consulta con soporte la configuración y compatibilidad de tu equipo antes de comenzar.",
    "¿Cómo funciona la integración con Shopify y WooCommerce?": "¿Puedo consultar mi negocio desde otro dispositivo?",
    "Conectas tu tienda en un paso con tus credenciales API. Cuando vendes online, el stock baja en el POS de tu local físico. Si vendes en el local, el inventario web se actualiza al instante. Sin doble digitación, sin desfases.": "Puedes acceder a tu cuenta desde el navegador y consultar las herramientas disponibles para tu usuario. Necesitas conexión para ver información actualizada de tu negocio.",
    "¿El soporte técnico está incluido en el precio?": "¿Dónde puedo pedir ayuda?",
    "Sí, todos los planes incluyen soporte técnico. Los planes intermedios y avanzados incluyen canal de WhatsApp prioritario con respuesta garantizada en menos de 15 minutos.": "En el chat puedes elegir hablar con ventas para resolver dudas sobre los planes, o con soporte para recibir ayuda con el sistema.",
    "¿Puedo configurar precios por volumen o precios mayoristas?": "¿Qué medios de pago puedo registrar?",
    "Sí. NexoPOS te permite configurar escalas de precios por cantidad (precios mayoristas, descuentos por volumen) por cada producto.": "El punto de venta permite registrar efectivo, débito, crédito, transferencias y pagos mixtos. El registro del pago en el sistema debe corresponder al pago que efectivamente recibiste.",
    "¿Los datos de mi negocio están seguros?": "¿Puedo revisar el stock de más de una sucursal?",
    "Sí. Toda la información viaja encriptada vía SSL y se almacena en servidores AWS de alta disponibilidad con respaldos automatizados cada 6 horas.": "Sí. Puedes consultar existencias por sucursal y registrar traspasos. Revisa en los planes la cantidad de sucursales y funciones que necesitas.",
    "¿Necesito comprar un Certificado Digital para la facturación electrónica?": "¿Qué hago después de conocer el sistema?",
    "No. NexoPOS incluye la gestión completa de firma digital y folios DTE en el plan. Nos encargamos de enrolar tu empresa ante el SII sin costo adicional.": "Compara los planes disponibles según tu operación. Si necesitas ayuda para elegir, usa la opción de hablar con ventas en el chat de esta página.",
    "Tu comercio merece un sistema que trabaje tan duro como tú.": "Tu próximo día de ventas puede estar más ordenado.",
    "Solicita una demo personalizada de 30 minutos. Te mostramos en vivo cómo NexoPOS opera en un comercio como el tuyo — sin términos técnicos, sin presión de venta.": "Prueba NexoPOS gratis durante 15 días. Carga tus productos, conoce la caja y descubre cómo llevar el control de tu negocio.",
    "El sistema POS más rápido de Chile. Control total de tu inventario, caja y sucursales en tiempo real.": "Sistema POS para almacenes, botillerías, minimarkets, tiendas y negocios de Chile. Ventas, inventario y caja en un mismo lugar.",
    "NexoPOS | Sistema POS Chile — Control Total de tu Comercio": "NexoPOS | Sistema POS en Chile · Prueba gratis 15 días",
    "Software punto de venta líder para PYMES chilenas. Ideal para minimarkets, ferreterías y almacenes. Sincronización de stock en tiempo real y caja ultrarrápida.": "Sistema POS para almacenes, botillerías, minimarkets y tiendas de ropa en Chile. Controla ventas, inventario y caja. Conócelo con 15 días de prueba gratis.",
    "sistema pos chile, software punto de venta, software para ferreterías, punto de venta minimarket, control inventario tiempo real, sistema ventas pyme chile, software inventario": "sistema pos chile, punto de venta almacén, pos botillería, software minimarket, pos tienda ropa, control inventario, prueba gratis 15 días",
    "Tu comercio no puede funcionar a ciegas.": "Vende con más tranquilidad.",
    "NexoPOS te devuelve el control total, en tiempo real.": "Ten tu negocio bajo control.",
    "El sistema POS más rápido de Chile. Stock sincronizado al instante, caja sin filas y tu operación completa en un solo panel — desde cualquier dispositivo.": "Un sistema POS para tu almacén, botillería, minimarket o tienda. Cobra, controla tu stock y revisa cómo va tu negocio desde un mismo lugar.",
    "Solicitar Demo Gratuita": "Comenzar mis 15 días gratis",
    "Ver el sistema en acción": "",
    "Si ya viviste esto, sabes exactamente de lo que hablamos.": "Menos dudas al cerrar. Más claridad para mañana.",
    "La caja que no cuadra nunca": "¿Cuánto vendiste hoy?",
    "Vendes lo que no tienes. Pierdes lo que no ves.": "¿Qué necesitas reponer?",
    "Filas que matan ventas y sucursales que operan como islas": "¿Cómo va tu otro local?",
    "Un sistema tan rápido como tu comercio. Tan preciso como necesitas.": "Atiende a tus clientes. NexoPOS te ayuda con el control.",
    "NexoPOS fue construido sobre una premisa simple: cada décima de segundo que ahorras en la caja y cada unidad que tu inventario registra correctamente, es dinero que vuelve a tu bolsillo. Una sola plataforma. Un solo dashboard. Cero doble digitación.": "Desde la primera venta de la mañana hasta el cierre de caja. Conecta las tareas de tu local para dedicar menos tiempo a buscar información y más a tu negocio.",
    "⚡ Caja Hiper-Rápida. Menos de 2 segundos por transacción.": "Punto de venta · Cobra con todo a mano",
    "📦 Stock Sincronizado al Instante. En Todos Tus Locales.": "Inventario · Sabe qué tienes para vender",
    "🏪 Control Multisucursal. Todo desde un Solo Panel.": "Sucursales · Crece sin perder de vista tu stock",
    "🌐 Tu Tienda Online Sincronizada con tu Local.": "Excel · Comienza con tus propios productos",
    "Planes escalables. Sin contratos. Sin sorpresas.": "Primero conócelo. Después elige tu plan.",
    "NexoPOS vs. Excel y sistemas del pasado": "",
    "Busca el producto por código de barra, nombre o categoría en milisegundos. El sistema calcula cambios, descuentos y propinas automáticamente. Múltiples métodos de pago en un clic. Funciona offline si cae el internet. Compatible con impresoras térmicas 57mm y 80mm, lectores de barra y gavetas electrónicas": "Encuentra productos por nombre o código de barras y registra distintos medios de pago. Atiende desde un catálogo ordenado y consulta el total antes de cobrar."
};

const DEFAULT_CFG: LandingConfig = {
    "hero": {
        "badge": "15 días de prueba gratis",
        "title": "Vende con más tranquilidad.",
        "titleHighlight": "Ten tu negocio bajo control.",
        "description": "Un sistema POS para tu almacén, botillería, minimarket o tienda. Cobra, controla tu stock y revisa cómo va tu negocio desde un mismo lugar.",
        "ctaPrimary": "Comenzar mis 15 días gratis",
        "ctaSecondary": "",
        "dteBanner": ""
    },
    "pain": {
        "title": "Menos dudas al cerrar. Más claridad para mañana.",
        "subtitle": "Tu día a día, más simple",
        "items": [
            {
                "title": "¿Cuánto vendiste hoy?",
                "description": "Consulta tus ventas y métodos de pago sin reunir anotaciones al final de la jornada. Revisa lo que pasó en caja con los movimientos a la vista."
            },
            {
                "title": "¿Qué necesitas reponer?",
                "description": "Revisa las existencias y las alertas de stock mínimo para preparar tus compras. Así puedes anticiparte cuando un producto comienza a escasear."
            },
            {
                "title": "¿Cómo va tu otro local?",
                "description": "Consulta el stock por sucursal y revisa los movimientos desde tu panel. Mantén una visión de tu negocio a medida que crece."
            }
        ]
    },
    "solution": {
        "title": "Atiende a tus clientes. NexoPOS te ayuda con el control.",
        "subtitle": "Las funciones que usas todos los días",
        "description": "Desde la primera venta de la mañana hasta el cierre de caja. Conecta las tareas de tu local para dedicar menos tiempo a buscar información y más a tu negocio."
    },
    "features": {
        "sectionTitle": "Lo que necesitas para vender y ordenar tu negocio.",
        "sectionSubtitle": "Herramientas prácticas, con beneficios que se notan en el día a día.",
        "items": [
            {
                "title": "Punto de venta · Cobra con todo a mano",
                "description": "Encuentra productos por nombre o código de barras y registra distintos medios de pago. Atiende desde un catálogo ordenado y consulta el total antes de cobrar."
            },
            {
                "title": "Inventario · Sabe qué tienes para vender",
                "description": "Consulta existencias, alertas de stock mínimo e historial de movimientos. Prepara la reposición con información de lo que entra y sale de tu negocio."
            },
            {
                "title": "Sucursales · Crece sin perder de vista tu stock",
                "description": "Revisa las existencias por local y registra traspasos entre sucursales. Ubica la mercadería disponible cuando necesitas abastecer otro punto de venta."
            },
            {
                "title": "Excel · Comienza con tus propios productos",
                "description": "Importa tu catálogo con una plantilla Excel y organiza productos por categoría, marca y código. Ahorra la carga manual de cada artículo para comenzar a trabajar."
            },
            {
                "title": "Caja · Cierra el día con más claridad",
                "description": "Abre y cierra turnos, registra movimientos y revisa los pagos de la jornada. Compara los montos registrados para identificar diferencias en tu caja."
            },
            {
                "title": "Reportes · Descubre qué se está vendiendo",
                "description": "Consulta tus ventas y los productos con mayor movimiento. Usa esa información para planificar compras y entender cómo marcha tu negocio."
            }
        ]
    },
    "useCases": {
        "title": "Un POS para tu forma de vender.",
        "subtitle": "Comercios de Chile",
        "items": [
            {
                "title": "Almacenes y minimarkets",
                "description": "Encuentra productos por código de barras, registra las ventas del día y revisa lo que queda en bodega. Ten más información para tu próxima reposición."
            },
            {
                "title": "Botillerías",
                "description": "Organiza bebidas y otros productos por categoría y marca. Consulta precios y existencias al atender, y revisa los pagos cuando termina el turno."
            },
            {
                "title": "Tiendas de ropa y accesorios",
                "description": "Identifica cada artículo con su propio código y organiza tu catálogo por categorías. Consulta lo disponible para atender a cada cliente con información a mano."
            },
            {
                "title": "Ferreterías, bazares y otros locales",
                "description": "Ordena un catálogo amplio por nombre, SKU o código de barras. Ubica los productos, controla movimientos y revisa las ventas desde el mismo sistema."
            }
        ]
    },
    "stats": {
        "items": []
    },
    "testimonials": {
        "items": []
    },
    "comparison": {
        "title": "",
        "subtitle": "",
        "rows": []
    },
    "pricing": {
        "title": "Primero conócelo. Después elige tu plan.",
        "subtitle": "Comienza con 15 días de prueba gratis. Revisa las funciones de cada plan y elige el que se ajuste al tamaño y las necesidades de tu negocio."
    },
    "faqs": {
        "title": "Antes de empezar, resolvamos tus dudas.",
        "subtitle": "Preguntas frecuentes",
        "items": [
            {
                "question": "¿El POS funciona si se cae el internet?",
                "answer": "Sí. Con un turno abierto y el catálogo guardado, el POS registra efectivo o pagos ya confirmados por otro medio. Las ventas se conservan en este equipo y se sincronizan automáticamente al volver la conexión o al reabrir la caja. Si la facturación está habilitada, ingresa la referencia del documento ya emitido por contingencia."
            },
            {
                "question": "¿Me sirve si tengo un solo local?",
                "answer": "Sí. Puedes comenzar con tu local y organizar ventas, productos y caja desde el mismo sistema. Si después abres otra sucursal, revisa el plan que se adapte a esa etapa."
            },
            {
                "question": "¿Cómo comienzo los 15 días de prueba gratis?",
                "answer": "Crea tu cuenta desde el botón de prueba gratuita, registra los datos de tu negocio y comienza a explorar NexoPOS. Tendrás 15 días para conocer el punto de venta y las herramientas de gestión."
            },
            {
                "question": "¿Puedo importar mis productos desde Excel?",
                "answer": "Sí. Descarga la plantilla e importa tu catálogo desde Excel. Puedes revisar el resultado de la carga y corregir las filas que lo necesiten."
            },
            {
                "question": "¿Puedo usar lector de código de barras e impresora?",
                "answer": "NexoPOS permite trabajar con lectores de códigos de barras e impresión de comprobantes. Consulta con soporte la configuración y compatibilidad de tu equipo antes de comenzar."
            },
            {
                "question": "¿Puedo consultar mi negocio desde otro dispositivo?",
                "answer": "Puedes acceder a tu cuenta desde el navegador y consultar las herramientas disponibles para tu usuario. Necesitas conexión para ver información actualizada de tu negocio."
            },
            {
                "question": "¿Dónde puedo pedir ayuda?",
                "answer": "En el chat puedes elegir hablar con ventas para resolver dudas sobre los planes, o con soporte para recibir ayuda con el sistema."
            },
            {
                "question": "¿Qué medios de pago puedo registrar?",
                "answer": "El punto de venta permite registrar efectivo, débito, crédito, transferencias y pagos mixtos. El registro del pago en el sistema debe corresponder al pago que efectivamente recibiste."
            },
            {
                "question": "¿Puedo revisar el stock de más de una sucursal?",
                "answer": "Sí. Puedes consultar existencias por sucursal y registrar traspasos. Revisa en los planes la cantidad de sucursales y funciones que necesitas."
            },
            {
                "question": "¿Qué hago después de conocer el sistema?",
                "answer": "Compara los planes disponibles según tu operación. Si necesitas ayuda para elegir, usa la opción de hablar con ventas en el chat de esta página."
            }
        ]
    },
    "cta": {
        "title": "Tu próximo día de ventas puede estar más ordenado.",
        "subtitle": "Prueba NexoPOS gratis durante 15 días. Carga tus productos, conoce la caja y descubre cómo llevar el control de tu negocio.",
        "button": "Comenzar mis 15 días gratis"
    },
    "footer": {
        "description": "Sistema POS para almacenes, botillerías, minimarkets, tiendas y negocios de Chile. Ventas, inventario y caja en un mismo lugar."
    },
    "seo": {
        "title": "NexoPOS | Sistema POS en Chile · Prueba gratis 15 días",
        "description": "Sistema POS para almacenes, botillerías, minimarkets y tiendas de ropa en Chile. Controla ventas, inventario y caja. Conócelo con 15 días de prueba gratis.",
        "keywords": "sistema pos chile, punto de venta almacén, pos botillería, software minimarket, pos tienda ropa, control inventario, prueba gratis 15 días"
    },
    "chatbot": {
        "enabled": false,
        "welcomeMessage": "¡Hola! Soy el asistente de NexoPOS. ¿Tienes alguna pregunta sobre el sistema o quieres agendar una demo gratuita?",
        "options": [
            "Quiero una Demo",
            "Ver Planes y Precios",
            "Soporte Técnico"
        ]
    }
};


// Upgrade the exact previous default copy while keeping custom CMS content intact.
function normalizeCopy(value: any): any {
    if (typeof value === 'string') return legacyCopy[value] ?? value;
    if (Array.isArray(value)) return value.map(normalizeCopy);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeCopy(item)]));
    return value;
}

function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key of Object.keys(override ?? {})) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
            result[key] = deepMerge(base[key] ?? {}, override[key]);
        } else if (Array.isArray(override[key]) && override[key].length === 0) {
            // Fallback to base array if the override array is empty (e.g. no items added in admin)
            result[key] = base[key] || [];
        } else if (override[key] !== undefined && override[key] !== null && override[key] !== '') {
            result[key] = normalizeCopy(override[key]);
        }
    }
    // The previous default had four features. Include the two new cards when that
    // unchanged default is loaded from the CMS; leave curated feature lists alone.
    if (Array.isArray(result.items) && base === DEFAULT_CFG.features && result.items.length === 4 &&
        result.items.every((item: any, index: number) => item.title === base.items[index].title && item.description === base.items[index].description)) {
        result.items = [...result.items, ...base.items.slice(4)];
    }
    return result;
}

function cleanHeading(value: string) {
    return (legacyCopy[value] ?? value).replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

const featureIcons: Record<string, LucideIcon> = {
    'punto de venta': ShoppingCart,
    inventario: Package,
    sucursales: Store,
    excel: FileSpreadsheet,
    caja: Wallet,
    reportes: BarChart3,
};

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: plans, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = usePublicPlans();

    const { data: remoteCfg } = useQuery<LandingConfig>({
        queryKey: ['landing-config'],
        queryFn: () => apiClient.get('/landing-config').then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });

    const cfg: LandingConfig = remoteCfg ? deepMerge(DEFAULT_CFG, remoteCfg) : DEFAULT_CFG;
    const { hero, pain, solution, features, useCases, pricing, faqs, cta, footer, seo } = cfg;

    React.useEffect(() => {
        const page = routeSeo('/');
        const title = seo?.title || page.title;
        const description = seo?.description || page.description;
        applyPageSeo({ ...page, title, description, keywords: seo?.keywords, structuredData: structuredData('/', title, description) });
    }, [seo]);


    return (
        <div className="public-site">
            <header className="public-header">
                <div className="public-container public-header-inner">
                    <Link to="/" className="public-brand" aria-label="NexoPOS, inicio">
                        <Logo variant="full" mode="light" className="h-10 w-auto" />
                    </Link>
                    <nav aria-label="Navegación principal" className="public-header-links desktop">
                        <a href="#features">Producto</a>
                        <a href="#use-cases">Sectores</a>
                        <a href="#pricing">Planes</a>
                        <a href="#faqs">Preguntas frecuentes</a>
                        <Link to="/login">Iniciar sesión</Link>
                        <Link to="/register" className="public-button">Prueba gratis 15 días</Link>
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
                        <Link to="/register" className="public-button">Prueba gratis 15 días</Link>
                    </nav>
                )}
            </header>
            <main>
                <section className="public-hero">
                    <div className="public-container public-hero-grid">
                        <div>
                            <p className="public-eyebrow">Sistema POS para los comercios de Chile</p>
                            <p className="public-trial-badge"><Check size={16} aria-hidden="true" />15 días de prueba gratis</p>
                            <h1>{hero.title} <span>{hero.titleHighlight}</span></h1>
                            <p className="public-copy">{hero.description}</p>
                            <div className="public-actions">
                                <Link to="/register" className="public-button">{hero.ctaPrimary}<ArrowRight size={16} aria-hidden="true" /></Link>
                            </div>
                            <p className="public-trial-note">Crea tu cuenta y conoce el sistema con los productos de tu negocio.</p>
                            <ul className="public-hero-benefits" aria-label="Beneficios principales">
                                <li><Check size={15} aria-hidden="true" />Ventas y caja en orden</li>
                                <li><Check size={15} aria-hidden="true" />Stock a la vista</li>
                                <li><Check size={15} aria-hidden="true" />Reportes para decidir</li>
                            </ul>
                        </div>
                        <figure className="public-preview">
                            <img src={hero.image || '/real-pos.webp'} alt="Punto de venta NexoPOS con catálogo de productos, carrito y total a cobrar" fetchPriority="high" width="1123" height="545" />
                            <figcaption>Tu catálogo, el carrito y el total de la venta en una misma pantalla.</figcaption>
                        </figure>
                    </div>
                </section>

                <section id="solution" className="public-section public-tools">
                    <div className="public-container">
                        <div className="public-section-intro public-tools-intro">
                            <div><p className="public-eyebrow">Herramientas para tu día a día</p><h2>{solution.title}</h2></div>
                            <p className="public-copy">{solution.description}</p>
                        </div>
                        {solution.image && <figure className="public-preview"><img src={solution.image} alt="Panel de gestión de NexoPOS" loading="lazy" /></figure>}
                        <div id="features" className="public-grid public-tools-grid" style={{ scrollMarginTop: 24 }}>
                            {features.items.map((item, i) => {
                                const [category, ...benefitParts] = cleanHeading(item.title).split(' · ');
                                const benefit = benefitParts.join(' · ');
                                const Icon = featureIcons[category.toLocaleLowerCase('es')] ?? LayoutGrid;
                                return <article key={i} className="public-tool-card">
                                    <div className="public-tool-heading"><span className="public-tool-icon"><Icon size={22} aria-hidden="true" /></span>{benefit && <p className="public-tool-label">{category}</p>}</div>
                                    <h3>{benefit || category}</h3>
                                    <p className="public-tool-description">{item.description}</p>
                                </article>;
                            })}
                        </div>
                        <div className="public-tools-footer">
                            <p>Conoce estas herramientas con los productos de tu negocio.<span>Tienes 15 días para probar NexoPOS gratis.</span></p>
                            <Link to="/register" className="public-button">Probar gratis por 15 días<ArrowRight size={16} aria-hidden="true" /></Link>
                        </div>
                    </div>
                </section>

                <section id="use-cases" className="public-section soft">
                    <div className="public-container">
                        <div className="public-section-intro"><p className="public-eyebrow">Del negocio de barrio a tu próxima sucursal</p><h2>{useCases.title}</h2><p className="public-copy">Para quienes atienden el mesón, reponen la mercadería y hacen crecer su negocio cada día.</p></div>
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

                <section className="public-section public-trial" aria-labelledby="trial-title">
                    <div className="public-container">
                        <div className="public-section-intro"><p className="public-eyebrow">Conócelo antes de elegir tu plan</p><h2 id="trial-title">15 días para probarlo en tu negocio.</h2><p className="public-copy">Explora NexoPOS a tu ritmo y descubre cómo se adapta a tu forma de vender.</p></div>
                        <ol className="public-grid public-trial-steps">
                            <li><span>01</span><h3>Crea tu cuenta</h3><p>Registra tu negocio y comienza tu prueba gratuita.</p></li>
                            <li><span>02</span><h3>Carga tus productos</h3><p>Agrega tu catálogo o impórtalo desde una plantilla Excel.</p></li>
                            <li><span>03</span><h3>Prueba tu operación</h3><p>Conoce el punto de venta, revisa tu stock y explora los reportes.</p></li>
                        </ol>
                        <div className="public-actions"><Link to="/register" className="public-button">Comenzar mis 15 días gratis<ArrowRight size={16} aria-hidden="true" /></Link></div>
                    </div>
                </section>

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
                                <Link to="/register" className={`public-button ${plan.isRecommended ? '' : 'secondary'}`}>Probar gratis 15 días</Link>
                            </article>)}
                        </div> : <p className="public-copy">Consulta los planes disponibles a través de <Link to="/contacto">nuestro equipo</Link>.</p>}
                    </div>
                </section>

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
                        <div><Link to="/" className="public-brand" aria-label="NexoPOS, inicio"><Logo variant="full" mode="light" className="h-10 w-auto" /></Link><p>{footer.description}</p></div>
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
