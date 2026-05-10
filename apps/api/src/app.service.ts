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
  footer: {
    description: 'El sistema inteligente para centralizar ventas, sucursales y operaciones B2B.',
  },
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
