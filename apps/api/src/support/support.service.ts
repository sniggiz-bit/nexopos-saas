import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma, ChatSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  accountChatSessionId,
  accountVisitorId,
  replyRoom,
  UUID_PATTERN,
} from './chat-identity';
import {
  SupportKnowledgeService,
  normalized,
  rankSupportArticles,
} from './support-knowledge.service';
import {
  GeminiSupportService,
  HUMAN_REQUEST,
  SupportAnswer,
} from './gemini-support.service';

type Actor = {
  id: string;
  tenantId: string;
  name: string | null;
  email: string;
  company: string;
};
type TurnInput = {
  message?: unknown;
  articleId?: unknown;
  clientMessageId?: unknown;
  intent?: unknown;
};
const isHumanRequest = (text: string) =>
  /\b(humano|humana|persona|asesor|asesora|ejecutivo|ejecutiva|agente)\b/.test(
    normalized(text),
  ) ||
  /no (me )?(sirve|ayuda|resuelve|funciona)|sigo con (el )?problema/.test(
    normalized(text),
  );
@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private knowledge: SupportKnowledgeService,
    private gemini: GeminiSupportService,
    private events: EventsGateway,
  ) {}
  async account(req: any): Promise<Actor> {
    const user = await this.prisma.user.findFirst({
      where: { id: req.user?.sub || '', tenantId: req.user?.tenantId || '' },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        tenant: { select: { name: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      company: user.tenant.name,
    };
  }
  private async lock(tx: Prisma.TransactionClient, id: string) {
    await tx.$queryRawUnsafe(
      'SELECT "id" FROM "ChatSession" WHERE "id"=$1 FOR UPDATE',
      id,
    );
    const session = await tx.chatSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Conversación no encontrada.');
    return session;
  }
  private async addMessage(
    tx: Prisma.TransactionClient,
    data: Prisma.ChatMessageUncheckedCreateInput,
  ) {
    const session = await tx.chatSession.update({
      where: { id: data.chatSessionId },
      data: { messageSequence: { increment: 1 } },
      select: { messageSequence: true },
    });
    return tx.chatMessage.create({
      data: { ...data, sequence: session.messageSequence },
    });
  }
  private async snapshot(id: string | null, audience: 'ACCOUNT' | 'PUBLIC') {
    const [settings, articles, session] = await Promise.all([
      this.knowledge.settings(),
      this.knowledge.published(audience),
      id
        ? this.prisma.chatSession.findUnique({
            where: { id },
            include: {
              messages: {
                orderBy: [
                  { sequence: 'desc' },
                  { createdAt: 'desc' },
                  { id: 'desc' },
                ],
                take: 200,
              },
            },
          })
        : null,
    ]);
    const suggestions = articles
      .filter((article) => article.isStarter)
      .slice(0, 8)
      .map((article) => ({
        id: article.id,
        label: article.question,
        category: article.category,
      }));
    return {
      sessionId: session?.id || null,
      visitorId: session?.visitorId || null,
      mode: session?.mode || 'BOT',
      status: session?.status || 'ACTIVE',
      processing: !!session?.pendingMessageId,
      welcomeMessage: settings.welcomeMessage,
      suggestions,
      messages: session?.messages.reverse() || [],
    };
  }
  async accountHistory(actor: Actor) {
    const id = accountChatSessionId(actor.tenantId, actor.id);
    const existing = await this.prisma.chatSession.findUnique({
      where: { id },
      select: { visitorId: true },
    });
    if (
      existing &&
      existing.visitorId !== accountVisitorId(actor.tenantId, actor.id)
    )
      throw new ConflictException(
        'La conversación no corresponde a esta cuenta.',
      );
    await this.expireOne(id);
    return this.snapshot(id, 'ACCOUNT');
  }
  async publicHistory(visitorId: unknown) {
    if (!visitorId) return this.snapshot(null, 'PUBLIC');
    if (
      typeof visitorId !== 'string' ||
      !UUID_PATTERN.test(visitorId) ||
      visitorId[14] === '8'
    )
      throw new BadRequestException('Identificador de visitante inválido.');
    const session = await this.prisma.chatSession.findFirst({
      where: { visitorId },
      orderBy: { updatedAt: 'desc' },
    });
    if (session) await this.expireOne(session.id);
    return this.snapshot(session?.id || null, 'PUBLIC');
  }
  async accountTurn(actor: Actor, input: TurnInput) {
    const sessionId = accountChatSessionId(actor.tenantId, actor.id);
    return this.turn(
      {
        sessionId,
        visitorId: accountVisitorId(actor.tenantId, actor.id),
        visitorName: (actor.name || actor.email) + ' — ' + actor.company,
        audience: 'ACCOUNT',
        actor,
      },
      input,
    );
  }
  async publicTurn(visitor: unknown, input: TurnInput) {
    if (
      visitor &&
      (typeof visitor !== 'string' ||
        !UUID_PATTERN.test(visitor) ||
        visitor[14] === '8')
    )
      throw new BadRequestException('Identificador de visitante inválido.');
    const visitorId =
      typeof visitor === 'string' && visitor ? visitor : randomUUID();
    // One public conversation per unguessable visitor capability; never accept account identities.
    const existing = await this.prisma.chatSession.findFirst({
      where: { visitorId },
      orderBy: { updatedAt: 'desc' },
    });
    return this.turn(
      {
        sessionId: existing?.id || visitorId,
        visitorId,
        visitorName: 'Visitante de NexoPOS',
        audience: 'PUBLIC',
      },
      input,
    );
  }
  private validate(input: TurnInput) {
    if (
      typeof input.message !== 'string' ||
      !input.message.trim() ||
      input.message.trim().length > 4000
    )
      throw new BadRequestException(
        'El mensaje debe tener entre 1 y 4000 caracteres.',
      );
    if (
      input.clientMessageId !== undefined &&
      (typeof input.clientMessageId !== 'string' ||
        !UUID_PATTERN.test(input.clientMessageId))
    )
      throw new BadRequestException('Identificador de mensaje inválido.');
    if (
      input.articleId !== undefined &&
      (typeof input.articleId !== 'string' ||
        !UUID_PATTERN.test(input.articleId))
    )
      throw new BadRequestException('Pregunta inválida.');
    if (input.intent !== undefined && input.intent !== 'human')
      throw new BadRequestException('Acción de soporte inválida.');
    return {
      message: input.message.trim(),
      clientId:
        typeof input.clientMessageId === 'string'
          ? input.clientMessageId
          : randomUUID(),
      articleId: typeof input.articleId === 'string' ? input.articleId : null,
      human: input.intent === 'human' || isHumanRequest(input.message),
    };
  }
  private async turn(
    context: {
      sessionId: string;
      visitorId: string;
      visitorName: string;
      audience: 'ACCOUNT' | 'PUBLIC';
      actor?: Actor;
    },
    input: TurnInput,
  ) {
    const request = this.validate(input);
    const article = request.articleId
      ? await this.knowledge.requireArticle(request.articleId, context.audience)
      : null;
    await this.expireOne(context.sessionId);
    const opened = await this.prisma.$transaction(async (tx) => {
      await tx.chatSession.upsert({
        where: { id: context.sessionId },
        create: {
          id: context.sessionId,
          visitorId: context.visitorId,
          visitorName: context.visitorName,
        },
        update: {},
      });
      let session = await this.lock(tx, context.sessionId);
      if (session.visitorId !== context.visitorId)
        throw new ConflictException(
          'La conversación no corresponde al visitante.',
        );
      const existing = await tx.chatMessage.findUnique({
        where: {
          chatSessionId_clientMessageId: {
            chatSessionId: session.id,
            clientMessageId: request.clientId,
          },
        },
      });
      if (existing) { if (existing.sender !== 'VISITOR' || existing.content !== request.message) throw new ConflictException('Este identificador corresponde a otro mensaje.'); return { id: existing.id, duplicate: true, bot: false }; }
      if (session.pendingMessageId && !request.human)
        throw new ConflictException(
          'El asistente está procesando la consulta anterior. Espera un momento antes de enviar otra.',
        );
      const recent = await tx.chatMessage.count({
        where: {
          chatSessionId: session.id,
          sender: 'VISITOR',
          createdAt: { gte: new Date(Date.now() - 60000) },
        },
      });
      if (recent >= 12)
        throw new BadRequestException(
          'Has enviado varias consultas seguidas. Espera un minuto antes de continuar.',
        );
      if (session.mode === 'RESOLVED')
        session = await tx.chatSession.update({
          where: { id: session.id },
          data: {
            mode: 'BOT',
            status: 'ACTIVE',
            assignedAdminId: null,
            resolvedAt: null,
            clarificationCount: 0,
          },
        });
      const message = await this.addMessage(tx, {
        chatSessionId: session.id,
        sender: 'VISITOR',
        content: request.message,
        clientMessageId: request.clientId,
      });
      const bot = session.mode === 'BOT' && !request.human;
      await tx.chatSession.update({
        where: { id: session.id },
        data: {
          visitorName: context.visitorName,
          updatedAt: new Date(),
          ...(bot
            ? { pendingMessageId: message.id, pendingSince: new Date() }
            : {}),
        },
      });
      if (request.human && session.mode === 'BOT')
        await this.handoff(tx, session, message.id, context.actor);
      return { id: message.id, duplicate: false, bot };
    });
    this.events.emitToTenant('superadmin', 'new_chat_message', {
      sessionId: context.sessionId,
      message: { sender: 'VISITOR' },
    });
    if (opened.bot) {
      let answer: SupportAnswer;
      try {
        answer = await this.respond(
          context.sessionId,
          request.message,
          context.audience,
          article,
        );
      } catch {
        answer = { action: 'handoff', text: HUMAN_REQUEST, sourceIds: [] };
      }
      await this.prisma.$transaction(async (tx) => {
        const session = await this.lock(tx, context.sessionId);
        if (session.mode !== 'BOT' || session.pendingMessageId !== opened.id)
          return;
        if (
          answer.action === 'handoff' ||
          (answer.action === 'clarify' && session.clarificationCount >= 1)
        ) {
          await this.handoff(tx, session, opened.id, context.actor);
          return;
        }
        const sources = answer.sourceIds.length
          ? await tx.supportArticle.findMany({
              where: {
                id: { in: answer.sourceIds },
                status: 'PUBLISHED',
                audience: { in: [context.audience, 'BOTH'] },
              },
              select: { id: true, question: true, version: true },
            })
          : [];
        if (
          answer.action === 'answer' &&
          (sources.length !== answer.sourceIds.length ||
            sources.some(
              (source) => answer.sourceVersions?.[source.id] !== source.version,
            ))
        ) {
          await this.handoff(tx, session, opened.id, context.actor);
          return;
        }
        await this.addMessage(tx, {
          chatSessionId: session.id,
          sender: 'BOT',
          content: answer.text,
          inReplyToId: opened.id,
          sources,
        });
        await tx.chatSession.update({
          where: { id: session.id },
          data: {
            pendingMessageId: null,
            pendingSince: null,
            clarificationCount:
              answer.action === 'clarify' ? session.clarificationCount + 1 : 0,
            updatedAt: new Date(),
          },
        });
      });
    }
    const snapshot = await this.snapshot(context.sessionId, context.audience);
    this.events.emitToTenant('superadmin', 'new_chat_message', {
      sessionId: context.sessionId,
      message: { sender: 'BOT' },
    });
    const reply =
      snapshot.messages.find((message) => message.inReplyToId === opened.id)
        ?.content || '';
    return { ...snapshot, reply };
  }
  private async respond(
    sessionId: string,
    question: string,
    audience: 'PUBLIC' | 'ACCOUNT',
    selected: any,
  ): Promise<SupportAnswer> {
    const settings = await this.knowledge.settings();
    if (!settings.enabled)
      return { action: 'handoff', text: HUMAN_REQUEST, sourceIds: [] };
    if (selected)
      return {
        action: 'answer',
        text: selected.answer,
        sourceIds: [selected.id],
        sourceVersions: { [selected.id]: selected.version },
      };
    const ranked = rankSupportArticles(
      question,
      await this.knowledge.published(audience),
    );
    if (ranked[0]?.exact)
      return {
        action: 'answer',
        text: ranked[0].article.answer,
        sourceIds: [ranked[0].article.id],
        sourceVersions: { [ranked[0].article.id]: ranked[0].article.version },
      };
    if (
      settings.aiEnabled &&
      (audience === 'ACCOUNT' || settings.publicAiEnabled) &&
      ranked.length &&
      (await this.knowledge.reserveAiCall())
    ) {
      const key = this.knowledge.key(settings);
      if (!key)
        return { action: 'handoff', text: HUMAN_REQUEST, sourceIds: [] };
      const history = await this.prisma.chatMessage.findMany({
        where: { chatSessionId: sessionId },
        orderBy: { sequence: 'desc' },
        take: 8,
        select: { sender: true, content: true },
      });
      return this.gemini.answer({
        key,
        model: settings.geminiModel,
        question,
        history: history.reverse(),
        articles: ranked.map((item) => ({
          id: item.article.id,
          version: item.article.version,
          question: item.article.question,
          answer: item.article.answer.slice(0, 4500),
        })),
      });
    }
    return {
      action: 'clarify',
      text: '¿Con qué tema necesitas ayuda? Elige una de las preguntas sugeridas o describe qué intentabas hacer y qué ocurrió. También puedes pedir hablar con una persona.',
      sourceIds: [],
    };
  }
  private async handoff(
    tx: Prisma.TransactionClient,
    session: ChatSession,
    replyTo: string,
    actor?: Actor,
  ) {
    if (session.mode !== 'BOT') return;
    const cycle = session.handoffCycle + 1;
    const [latest, existing] = await Promise.all([
      tx.chatMessage.findMany({
        where: { chatSessionId: session.id, sender: 'VISITOR' },
        orderBy: { sequence: 'desc' },
        take: 5,
        select: { content: true },
      }),
      tx.chatMessage.findUnique({ where: { inReplyToId: replyTo } }),
    ]);
    if (!existing)
      await this.addMessage(tx, {
        chatSessionId: session.id,
        sender: 'BOT',
        content: HUMAN_REQUEST,
        inReplyToId: replyTo,
      });
    const title = actor
      ? 'Usuario de NexoPOS solicita soporte'
      : 'Visitante de NexoPOS solicita atención';
    const identity = actor
      ? 'Origen: Usuario registrado de NexoPOS\nUsuario: ' +
        (actor.name || 'Sin nombre') +
        '\nCorreo: ' +
        actor.email +
        '\nEmpresa: ' +
        actor.company
      : 'Origen: Chat público de NexoPOS\nVisitante: ' + session.visitorName;
    const message =
      identity +
      '\n\nConsultas recientes:\n' +
      latest
        .reverse()
        .map((item) => item.content)
        .join('\n\n')
        .slice(0, 6000);
    const notification = await tx.systemNotification.create({
      data: { title, message, type: 'CHAT' },
    });
    await tx.supportHandoffNotice.create({
      data: {
        chatSessionId: session.id,
        cycle,
        title,
        message,
        notificationId: notification.id,
      },
    });
    await tx.chatSession.update({
      where: { id: session.id },
      data: {
        mode: 'WAITING_HUMAN',
        status: 'ACTIVE',
        pendingMessageId: null,
        pendingSince: null,
        handoffCycle: cycle,
        updatedAt: new Date(),
      },
    });
  }
  async expireOne(id: string) {
    const stale = await this.prisma.chatSession.findFirst({
      where: {
        id,
        mode: 'BOT',
        pendingMessageId: { not: null },
        pendingSince: { lt: new Date(Date.now() - 45000) },
      },
    });
    if (!stale) return;
    await this.prisma.$transaction(async (tx) => {
      const session = await this.lock(tx, id);
      if (
        session.mode !== 'BOT' ||
        !session.pendingMessageId ||
        !session.pendingSince ||
        Date.now() - session.pendingSince.getTime() <= 45000
      )
        return;
      let actor: Actor | undefined;
      if (session.visitorId.startsWith('account:')) {
        const [, tenantId, userId] = session.visitorId.split(':');
        const user = await tx.user.findFirst({
          where: { id: userId, tenantId },
          include: { tenant: { select: { name: true } } },
        });
        if (user)
          actor = {
            id: user.id,
            tenantId,
            name: user.name,
            email: user.email,
            company: user.tenant.name,
          };
      }
      await this.handoff(tx, session, session.pendingMessageId, actor);
    });
  }
  async adminAction(id: string, action: string, actorId: string) {
    if (
      !UUID_PATTERN.test(id) ||
      !['claim', 'resolve', 'resume'].includes(action)
    )
      throw new BadRequestException('Acción de conversación inválida.');
    await this.prisma.$transaction(async (tx) => {
      const session = await this.lock(tx, id);
      await tx.chatSession.update({
        where: { id },
        data: {
          mode:
            action === 'claim'
              ? 'HUMAN'
              : action === 'resolve'
                ? 'RESOLVED'
                : 'BOT',
          status: action === 'resolve' ? 'CLOSED' : 'ACTIVE',
          assignedAdminId: action === 'claim' ? actorId : null,
          pendingMessageId: null,
          pendingSince: null,
          clarificationCount: 0,
          resolvedAt: action === 'resolve' ? new Date() : null,
          updatedAt: new Date(),
        },
      });
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          message: 'SUPPORT_CONVERSATION_UPDATED',
          context: {
            actorId,
            sessionId: id,
            action,
            previousMode: session.mode,
          },
        },
      });
    });
    return { updated: true };
  }
  async adminReply(
    sessionId: string,
    content: unknown,
    actorId: string,
    clientMessageId?: string,
  ) {
    const message = this.validate({ message: content, clientMessageId });
    if (!UUID_PATTERN.test(sessionId))
      throw new BadRequestException('Conversación inválida.');
    const saved = await this.prisma.$transaction(async (tx) => {
      const session = await this.lock(tx, sessionId);
      const previous = await tx.chatMessage.findUnique({
        where: {
          chatSessionId_clientMessageId: {
            chatSessionId: sessionId,
            clientMessageId: message.clientId,
          },
        },
      });
      if (previous) {
        if (previous.sender !== 'ADMIN' || previous.content !== message.message)
          throw new ConflictException(
            'El identificador ya corresponde a otro mensaje.',
          );
        return { saved: previous, visitorId: session.visitorId };
      }
      const saved = await this.addMessage(tx, {
        chatSessionId: sessionId,
        sender: 'ADMIN',
        content: message.message,
        clientMessageId: message.clientId,
      });
      await tx.chatSession.update({
        where: { id: session.id },
        data: {
          mode: 'HUMAN',
          status: 'ACTIVE',
          assignedAdminId: actorId,
          pendingMessageId: null,
          pendingSince: null,
          resolvedAt: null,
          updatedAt: new Date(),
        },
      });
      return { saved, visitorId: session.visitorId };
    });
    this.events.emitToTenant(replyRoom(saved.visitorId), 'admin_reply', {
      sessionId,
      id: saved.saved.id,
      message: saved.saved.content,
      sender: 'ADMIN',
    });
    return saved.saved;
  }
  async sessions(selected?: string, filter?: string) {
    if (
      (selected && !UUID_PATTERN.test(selected)) ||
      (filter &&
        !['BOT', 'WAITING_HUMAN', 'HUMAN', 'RESOLVED', 'ALL'].includes(filter))
    )
      throw new BadRequestException('Filtro de conversaciones inválido.');
    const base =
      filter && filter !== 'ALL'
        ? { mode: filter }
        : filter === 'ALL'
          ? {}
          : { status: 'ACTIVE' };
    const include = {
      messages: {
        orderBy: [
          { sequence: 'desc' as const },
          { createdAt: 'desc' as const },
          { id: 'desc' as const },
        ],
        take: 1,
      },
      notices: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { status: true, attempts: true },
      },
    };
    const result = await this.prisma.chatSession.findMany({
      where: base,
      include,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    if (selected) {
      const session = await this.prisma.chatSession.findUnique({
        where: { id: selected },
        include: { ...include, messages: { ...include.messages, take: 200 } },
      });
      if (session) { const index = result.findIndex(item => item.id === selected); if (index >= 0) result[index] = session; else result.unshift(session); }
    }
    return result.map((session) => ({
      ...session,
      messages: session.messages.reverse(),
    }));
  }
}
