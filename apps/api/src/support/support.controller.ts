import { Controller, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('support')
export class SupportController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Req() req: any, @Body('message') message: string) {
    const user = req.user;
    if (!user || !user.tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }

    // Fetch tenant's active modules to provide context
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        plan: { include: { planModules: { include: { module: true } } } },
        tenantModuleAddons: { include: { module: true } },
      }
    });

    const activeModules = [
      ...(tenant?.plan?.planModules.map(pm => pm.module.name) || []),
      ...(tenant?.tenantModuleAddons.map(ma => ma.module.name) || [])
    ];

    const context = `El usuario es ${user.name} (${user.role}). Pertenece a la tienda ${tenant?.name}. 
    Módulos activos: ${activeModules.join(', ')}.`;

    // Simulated LLM response
    const lowercaseMsg = message.toLowerCase();
    let reply = "Soy el asistente inteligente de NexoPOS. ¿En qué te puedo ayudar hoy?";

    if (lowercaseMsg.includes('shopify') || lowercaseMsg.includes('ecommerce') || lowercaseMsg.includes('tienda online')) {
      if (activeModules.includes('Shopify Integration') || activeModules.includes('WooCommerce Integration')) {
        reply = "Veo que tienes contratada la integración de E-commerce. Para configurarla, ve a la sección de 'Integraciones' en el menú lateral.";
      } else {
        reply = "Actualmente no tienes ningún módulo de E-commerce activo. Puedes contratarlo directamente en la sección 'Suscripción' de tu panel.";
      }
    } else if (lowercaseMsg.includes('factura') || lowercaseMsg.includes('boleta') || lowercaseMsg.includes('sii')) {
      if (activeModules.includes('DTE - Boleta Electrónica') || activeModules.includes('DTE - Factura Electrónica')) {
        reply = "Tus documentos electrónicos (DTE) están activos. Puedes emitirlos al momento de cobrar en el Punto de Venta.";
      } else {
        reply = "Para emitir documentos electrónicos (SII) necesitas activar un módulo DTE. Visita 'Suscripción' para agregarlo a tu plan mensual.";
      }
    } else if (lowercaseMsg.includes('hola')) {
      reply = `¡Hola! Qué gusto saludarte. Soy el bot de soporte de NexoPOS. Veo que tienes tu plan al día en tu tienda ${tenant?.name}. ¿Qué necesitas?`;
    }

    // Notify SuperAdmin
    await this.notificationsService.notifySuperAdmin(
      'Nuevo Mensaje de Soporte',
      `${user.name} (${tenant?.name}): ${message}`,
      'CHAT'
    );

    return {
      reply,
      contextUsed: context
    };
  }

  @Public()
  @Post('public-chat')
  async publicChat(@Body('message') message: string) {
    const lowercaseMsg = message.toLowerCase();
    let reply = "Soy el asistente inteligente de NexoPOS. ¿En qué te puedo ayudar hoy?";

    if (lowercaseMsg.includes('ventas') || lowercaseMsg.includes('planes')) {
      reply = "¡Excelente! NexoPOS es el sistema de gestión B2B líder. Puedes iniciar una prueba gratis de 15 días o contactar a un ejecutivo de ventas a ventas@nexopos.cl para una demostración personalizada.";
    } else if (lowercaseMsg.includes('soporte')) {
      reply = "Si ya eres cliente, por favor inicia sesión en tu cuenta y usa el Chat de Soporte interno para asistencia prioritaria, o escríbenos a soporte@nexopos.cl.";
    } else if (lowercaseMsg.includes('facturacion') || lowercaseMsg.includes('pagos')) {
      reply = "Para dudas de facturación o pagos de tu suscripción, escríbenos a pagos@nexopos.cl indicando el RUT de tu empresa.";
    } else if (lowercaseMsg.includes('hola')) {
      reply = "¡Hola! Bienvenido a NexoPOS. Por favor selecciona una de las opciones o descríbeme qué necesitas.";
    }

    // Notify SuperAdmin
    await this.notificationsService.notifySuperAdmin(
      'Nuevo Mensaje en Chatbot Público',
      `Visitante anónimo dice: ${message}`,
      'CHAT'
    );

    return { reply };
  }
}
