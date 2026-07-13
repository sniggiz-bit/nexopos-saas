import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

const DEFAULT_LANDING_CONFIG = {
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

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getLandingConfig() {
    try {
      const record = await this.prisma.landingConfig.findUnique({ where: { id: 'singleton' } });
      if (!record) return DEFAULT_LANDING_CONFIG;
      return { ...DEFAULT_LANDING_CONFIG, ...(record.data as object) };
    } catch {
      return DEFAULT_LANDING_CONFIG;
    }
  }
}
