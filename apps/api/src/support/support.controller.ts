import { Controller, Post, Get, Body, Req, UseGuards, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { randomUUID } from 'node:crypto';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { accountVisitorId, accountChatSessionId, replyRoom, UUID_PATTERN } from './chat-identity';

@Controller('support')
export class SupportController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  private validateMessage(message: unknown): string {
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 4000) {
      throw new BadRequestException('El mensaje debe tener entre 1 y 4000 caracteres.');
    }
    return message.trim();
  }

  private async accountUser(req: any) {
    if (!req.user?.sub || !req.user?.tenantId) throw new UnauthorizedException('No tenant context found');
    const user = await this.prisma.user.findFirst({
      where: { id: req.user.sub, tenantId: req.user.tenantId },
      select: { id: true, name: true, email: true, tenantId: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado en esta empresa.');
    return user;
  }

  @Get('chat')
  @UseGuards(JwtAuthGuard)
  async getChat(@Req() req: any) {
    const user = await this.accountUser(req);
    const session = await this.prisma.chatSession.findFirst({
      where: { id: accountChatSessionId(user.tenantId, user.id), visitorId: accountVisitorId(user.tenantId, user.id) },
      include: { messages: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 200 } },
    });
    return { sessionId: session?.id || null, messages: session?.messages.reverse() || [] };
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Req() req: any, @Body('message') input: string) {
    const message = this.validateMessage(input);
    const user = await this.accountUser(req);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { name: true } });
    const reply = 'Recibimos tu consulta. El equipo de soporte ha sido notificado y podrá responderte por este mismo chat.';
    const sessionId = accountChatSessionId(user.tenantId, user.id);
    const result = await this.prisma.$transaction(async tx => {
      const session = await tx.chatSession.upsert({
        where: { id: sessionId },
        create: { id: sessionId, visitorId: accountVisitorId(user.tenantId, user.id), visitorName: `${user.name || user.email} — ${tenant?.name || 'Comercio'}` },
        update: { status: 'ACTIVE', updatedAt: new Date(), visitorName: `${user.name || user.email} — ${tenant?.name || 'Comercio'}` },
      });
      const now = new Date();
      const userMessage = await tx.chatMessage.create({ data: { chatSessionId: session.id, sender: 'VISITOR', content: message, createdAt: now } });
      const botMessage = await tx.chatMessage.create({ data: { chatSessionId: session.id, sender: 'BOT', content: reply, createdAt: new Date(now.getTime() + 1) } });
      return { session, messages: [userMessage, botMessage] };
    });
    this.notificationsService.notifySuperAdmin(
      'Usuario de NexoPOS solicita soporte',
      `Origen: Usuario registrado de NexoPOS\nUsuario: ${user.name || 'Sin nombre'}\nCorreo: ${user.email}\nEmpresa: ${tenant?.name || 'Comercio'}\n\nMensaje:\n${message}`,
      'CHAT',
      { actionPath: `/admin/live-chats?session=${encodeURIComponent(sessionId)}` },
    ).catch(() => console.error('Failed to notify superadmin about support chat'));
    this.eventsGateway.emitToTenant('superadmin', 'new_chat_message', { sessionId, message: result.messages[0] });
    return { reply, sessionId, messages: result.messages };
  }

  @Public()
  @Post('public-chat')
  async publicChat(@Body('message') message: string, @Body('visitorId') visitorIdBody?: string) {
    message = this.validateMessage(message);
    if (visitorIdBody && !UUID_PATTERN.test(visitorIdBody)) throw new BadRequestException('Identificador de visitante inválido.');
    const visitorId = visitorIdBody || randomUUID();
    
    // Find or create active session
    let session = await this.prisma.chatSession.findFirst({
      where: { visitorId, status: 'ACTIVE' }
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { visitorId, visitorName: 'Visitante Anónimo' }
      });
    }

    // Save visitor message
    await this.prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: 'VISITOR',
        content: message
      }
    });

    const lowercaseMsg = message.toLowerCase();
    let reply = "Soy el asistente inteligente de NexoPOS. ¿En qué te puedo ayudar hoy? En breve un agente se conectará si necesitas más ayuda.";

    if (lowercaseMsg.includes('ventas') || lowercaseMsg.includes('planes')) {
      reply = "¡Excelente! NexoPOS es el sistema de gestión B2B líder. Puedes iniciar una prueba gratis de 15 días o contactar a un ejecutivo de ventas a ventas@nexopos.cl para una demostración personalizada.";
    } else if (lowercaseMsg.includes('soporte')) {
      reply = "Si ya eres cliente, por favor inicia sesión en tu cuenta y usa el Chat de Soporte interno para asistencia prioritaria, o escríbenos a soporte@nexopos.cl.";
    } else if (lowercaseMsg.includes('facturacion') || lowercaseMsg.includes('pagos')) {
      reply = "Para dudas de facturación o pagos de tu suscripción, escríbenos a pagos@nexopos.cl indicando el RUT de tu empresa.";
    } else if (lowercaseMsg.includes('hola')) {
      reply = "¡Hola! Bienvenido a NexoPOS. Por favor selecciona una de las opciones o descríbeme qué necesitas.";
    }

    // Save bot reply
    await this.prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: 'BOT',
        content: reply
      }
    });

    await this.prisma.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

    // Notify SuperAdmin (non-blocking) about the visitor message
    this.notificationsService.notifySuperAdmin(
      'Nuevo Mensaje en Chatbot',
      `Visitante dice: ${message}`,
      'CHAT',
      { actionPath: `/admin/live-chats?session=${encodeURIComponent(session.id)}` }
    ).catch(e => console.error('Failed to notify superadmin:', e));

    // Emit to superadmin room so they see the new message in real time
    this.eventsGateway.emitToTenant('superadmin', 'new_chat_message', {
      sessionId: session.id,
      visitorId,
      message: { sender: 'VISITOR', content: message }
    });

    return { reply, visitorId, sessionId: session.id };
  }

  @Post('admin-reply')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async adminReply(@Req() _req: any, @Body('sessionId') sessionId: string, @Body('message') input: string) {
    const message = this.validateMessage(input);
    if (!UUID_PATTERN.test(sessionId || '')) throw new BadRequestException('Conversación inválida.');
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Conversación no encontrada.');
    const room = replyRoom(session.visitorId);
    const chatMsg = await this.prisma.$transaction(async tx => {
      const saved = await tx.chatMessage.create({ data: { chatSessionId: sessionId, sender: 'ADMIN', content: message } });
      await tx.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date(), status: 'ACTIVE' } });
      return saved;
    });
    this.eventsGateway.emitToTenant(room, 'admin_reply', { sessionId, id: chatMsg.id, message: chatMsg.content, sender: 'ADMIN' });
    return chatMsg;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('active-sessions')
  async getActiveSessions(@Req() _req: any, @Body('sessionId') sessionId?: string) {
    if (sessionId && !UUID_PATTERN.test(sessionId)) throw new BadRequestException('Conversación inválida.');
    const sessions = await this.prisma.chatSession.findMany({
      where: sessionId ? { OR: [{ status: 'ACTIVE' }, { id: sessionId }] } : { status: 'ACTIVE' },
      include: { messages: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 200 } },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map(session => ({ ...session, messages: session.messages.reverse() }));
  }
}
