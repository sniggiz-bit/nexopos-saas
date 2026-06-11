import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

const DEFAULT_LANDING_CONFIG = {
  hero: {
    badge: 'Plataforma B2B para PYMES',
    title: 'Mucho más que un POS: El Sistema de Gestión',
    titleHighlight: 'Integral para tu Empresa',
    description: 'Centraliza tus ventas, inventario, proveedores y sucursales en una única plataforma en la nube diseñada para acelerar tu crecimiento.',
    ctaPrimary: 'Comenzar gratis',
    ctaSecondary: 'Ver Planes',
    dteBanner: 'Además, incluye Facturación Electrónica DTE integrada con el SII.',
  },
  pain: {
    title: 'Dirigir un negocio es difícil. Administrarlo a ciegas es peligroso.',
    subtitle: 'EL CAOS OPERATIVO DIARIO',
    items: [
      { title: 'Inventarios Descuadrados', description: 'Nunca sabes con certeza qué hay en bodega. Vendes productos sin stock en tu tienda online y pierdes clientes por quiebres en sala de venta.' },
      { title: 'El SII consume tu tiempo', description: 'Emitir facturas o boletas a mano o en sistemas lentos te quita horas valiosas al final del día. Un error manual y te expones a multas.' },
      { title: 'Sucursales Desconectadas', description: 'No sabes cuál local vende más hoy, qué caja está cuadrada o si hay robo hormiga a menos que vayas físicamente a inspeccionar.' }
    ]
  },
  solution: {
    title: 'Toda tu operación comercial en piloto automático.',
    subtitle: 'NEXOPOS AL RESCATE',
    description: 'NexoPOS centraliza las partes más difíciles de tu negocio en una interfaz limpia, veloz y accesible desde cualquier dispositivo. Deja atrás las planillas de Excel y los sistemas lentos de los años 90.'
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
  useCases: {
    title: 'Diseñado para el comercio real en Chile.',
    subtitle: 'SECTORES COMPATIBLES',
    items: [
      { title: 'Minimarkets y Almacenes', description: 'Lectura ultra rápida de código de barras, balanzas integradas y control de vencimientos.' },
      { title: 'Ferreterías y Repuestos', description: 'Gestión de miles de SKUs, equivalencias de productos y ventas mayoristas con cuentas corrientes de clientes.' },
      { title: 'Tiendas de Mascotas y Retail', description: 'Variantes de productos (talla, color, sabor), control de servicios y promociones dinámicas.' },
      { title: 'Distribuidoras y Mayoristas', description: 'Módulo de compras robusto, márgenes de ganancia por volumen y rutas de despacho automatizadas.' }
    ]
  },
  stats: {
    items: [
      { label: 'Empresas Activas en Chile', value: '+350' },
      { label: 'Transacciones Procesadas', value: '+15 Millones' },
      { label: 'Uptime del Servidor (AWS)', value: '99.98%' }
    ]
  },
  testimonials: {
    items: [
      { name: 'Francisco Pérez', role: 'Fundador de "Almacén Providencia"', content: 'NexoPOS nos permitió abrir 3 sedes en un año. Antes pasábamos el fin de semana cuadrando inventarios de forma manual; ahora todo se hace en tiempo real desde el celular.' },
      { name: 'Alejandra Fravéga', role: 'Gerente de Operaciones en "Distribuidora Ponchos del Cachapoal"', content: 'La facturación electrónica con el SII nunca falló. Tuvimos soporte de inmediato por WhatsApp el primer día que abrimos caja. Es un cambio del cielo a la tierra.' }
    ]
  },
  comparison: {
    title: 'NexoPOS vs Sistemas tradicionales y planillas',
    subtitle: 'COMPARATIVA CIENTÍFICA',
    rows: [
      { feature: 'Sincronización en la nube', nexopos: 'Sí, 100% Tiempo Real', excel: 'No (Archivos locales aislados)', traditional: 'A veces (Servidores locales lentos)' },
      { feature: 'Facturación DTE / SII', nexopos: 'Integrado Automáticamente', excel: 'No (Requiere doble digitación)', traditional: 'Requiere pago extra por integración' },
      { feature: 'Velocidad de venta POS', nexopos: 'Menos de 2 segundos', excel: 'Lento e ineficiente', traditional: 'Lento, requiere terminales específicas' },
      { feature: 'Soporte Técnico en Vivo', nexopos: 'Sí, WhatsApp Directo', excel: 'No (Tú lo resuelves solo)', traditional: 'Soporte telefónico costoso o ausente' },
      { feature: 'Conexión E-commerce', nexopos: 'Sí (Shopify & WooCommerce)', excel: 'No', traditional: 'No disponible' }
    ]
  },
  pricing: {
    title: 'Planes escalables para tu crecimiento',
    subtitle: 'Invierte en la tecnología correcta sin contratos forzosos. Elige el plan que soporte tu operación actual.',
  },
  faqs: {
    title: 'Preguntas Frecuentes',
    subtitle: 'Respuestas claras para eliminar objeciones antes de comenzar.',
    items: [
      { question: '¿Necesito comprar mi propio Certificado Digital para emitir boletas o facturas?', answer: 'No. NexoPOS incluye la gestión de firma digital y folios integrados en el plan. Nosotros nos encargamos de enrolar tu empresa ante el SII sin costo extra.' },
      { question: '¿Funciona el POS si se cae el internet?', answer: 'Sí. El Punto de Venta cuenta con un modo offline inteligente. Puedes seguir vendiendo y registrando pagos. Tan pronto vuelva la señal, los datos se sincronizan con la nube.' },
      { question: '¿Puedo importar mis productos desde Excel u otro sistema que ya utilizo?', answer: '¡Por supuesto! Nuestro panel cuenta con un importador masivo en Excel. Si tienes dificultades, nuestro equipo de soporte te asiste para migrar toda tu base de datos en menos de 1 hora.' },
      { question: '¿Tengo que firmar un contrato de permanencia mínima?', answer: 'No. El servicio se cobra de forma mensual y puedes cancelarlo o cambiar de plan cuando quieras sin multas ni costos extras.' },
      { question: '¿Qué pasa si excedo el límite de usuarios de mi plan?', answer: 'Puedes contratar usuarios adicionales como add-ons directamente desde tu panel de control a una fracción del costo, o subir al siguiente plan.' },
      { question: '¿NexoPOS es compatible con lectores de código de barra y gavetas de dinero?', answer: 'Sí, es compatible con el 99% de los hardwares POS USB y Bluetooth del mercado (lectores de barra, impresoras térmicas de 57mm y 80mm, y gavetas electrónicas).' },
      { question: '¿Cómo funciona la integración con Shopify y WooCommerce?', answer: 'Conectas tu tienda con tus credenciales API en un paso. Cuando vendes online, el stock baja en el POS de tu tienda física. Si vendes en el local, el inventario web se actualiza al instante.' },
      { question: '¿El soporte técnico está incluido en el precio?', answer: 'Sí, todos los planes incluyen soporte técnico nativo. Los planes intermedio y avanzado incluyen canal de WhatsApp prioritario con respuesta en menos de 15 minutos.' },
      { question: '¿Puedo manejar distintas tarifas o precios por volumen?', answer: 'Sí, NexoPOS te permite configurar escalas de precios (precios mayoristas, ofertas por cantidad) por producto.' },
      { question: '¿Los datos de mi negocio están seguros?', answer: 'Sí. Toda la información viaja encriptada vía SSL y se almacena en servidores AWS de alta seguridad con respaldos automatizados cada 6 horas.' }
    ]
  },
  cta: {
    title: '¿Listo para transformar la gestión de tu empresa?',
    subtitle: 'Únete a las empresas que ya digitalizaron sus operaciones con NexoPOS.',
    button: 'Comenzar 15 Días Gratis',
  },
  footer: {
    description: 'El sistema inteligente para centralizar ventas, sucursales y operaciones B2B.',
  },
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
