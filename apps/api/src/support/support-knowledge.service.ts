import { Prisma } from "@prisma/client";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiSupportService } from './gemini-support.service';
import { decryptSupportKey, encryptSupportKey } from './support-secrets';

export function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const ignored = new Set(
  'como que el la los las de del en un una para por con mi mis me se al y o es tengo necesito ayuda quiero puedo hacer esta este'.split(
    ' ',
  ),
);
export function rankSupportArticles(question: string, articles: any[]) {
  const text = normalized(question);
  const tokens = [
    ...new Set(
      text.split(' ').filter((word) => word.length > 2 && !ignored.has(word)),
    ),
  ];
  return articles
    .map((article) => {
      const phrases = [
        article.question,
        ...(Array.isArray(article.aliases) ? article.aliases : []),
      ].map(normalized);
      const exact = phrases.includes(text);
      const words = new Set(
        normalized(
          [article.question, article.category, ...phrases].join(' '),
        ).split(' '),
      );
      const answerWords = new Set(normalized(String(article.answer || '')).split(' '));
      return {
        article,
        exact,
        score: exact
          ? 100
          : tokens.reduce(
              (score, word) => score + (words.has(word) ? 1 : answerWords.has(word) ? 0.25 : 0),
              0,
            ),
      };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.article.sortOrder - b.article.sortOrder,
    )
    .slice(0, 6);
}
@Injectable()
export class SupportKnowledgeService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiSupportService,
  ) {}
  async settings() {
    const existing = await this.prisma.supportSettings.findUnique({ where: { id: 'main' } });
    if (existing) return existing;
    await this.prisma.supportSettings.createMany({ data: [{ id: 'main' }], skipDuplicates: true });
    return this.prisma.supportSettings.findUniqueOrThrow({ where: { id: 'main' } });
  }
  key(settings: { encryptedApiKey: string | null }) {
    if (settings.encryptedApiKey)
      return decryptSupportKey(settings.encryptedApiKey);
    return process.env.GEMINI_API_KEY?.trim() || '';
  }
  async configuration() {
    const settings = await this.settings();
    let keyConfigured = false;
    try {
      keyConfigured = !!this.key(settings);
    } catch {
      /* A rotated encryption key requires entering the API key again. */
    }
    const { encryptedApiKey: _secret, ...safe } = settings;
    const day = new Date().toISOString().slice(0, 10);
    return {
      ...safe,
      dailyCalls: settings.usageDate === day ? settings.dailyCalls : 0,
      keyConfigured,
    };
  }
  async checkKey(input: any) {
    const settings = await this.settings();
    return {
      models: await this.gemini.models(
        typeof input?.apiKey === 'string' && input.apiKey.trim()
          ? input.apiKey.trim()
          : this.key(settings),
      ),
    };
  }
  async updateSettings(input: any, actorId: string) {
    const settings = await this.settings();
    for (const field of ['enabled', 'aiEnabled', 'publicAiEnabled'])
      if (input[field] !== undefined && typeof input[field] !== 'boolean')
        throw new BadRequestException('La configuración no es válida.');
    if (!Number.isInteger(input.version) || input.version !== settings.version)
      throw new ConflictException(
        'La configuración cambió. Actualiza antes de guardar.',
      );
    if (
      !Number.isInteger(input.dailyLimit) ||
      input.dailyLimit < 1 ||
      input.dailyLimit > 10000
    )
      throw new BadRequestException(
        'El límite debe estar entre 1 y 10.000 consultas por día.',
      );
    if (
      typeof input.welcomeMessage !== 'string' ||
      !input.welcomeMessage.trim() ||
      input.welcomeMessage.length > 600
    )
      throw new BadRequestException(
        'El saludo debe tener entre 1 y 600 caracteres.',
      );
    if (
      typeof input.geminiModel !== 'string' ||
      (input.geminiModel &&
        !/^gemini-[a-z0-9.-]{1,100}$/.test(input.geminiModel))
    )
      throw new BadRequestException('Selecciona un modelo válido.');
    let encryptedApiKey = settings.encryptedApiKey;
    if (
      input.apiKey !== undefined &&
      (typeof input.apiKey !== 'string' || input.apiKey.length > 300)
    )
      throw new BadRequestException('La clave no es válida.');
    if (input.apiKey?.trim()) {
      if (input.apiKey.trim().length < 20 || /\s/.test(input.apiKey.trim()))
        throw new BadRequestException(
          'Ingresa una clave válida de Gemini API.',
        );
      try {
        encryptedApiKey = encryptSupportKey(input.apiKey.trim());
      } catch {
        throw new BadRequestException(
          'El servidor no puede guardar la clave de forma segura. Contacta al administrador técnico.',
        );
      }
    }
    const aiEnabled = input.aiEnabled === true;
    if (aiEnabled) {
      let key = '';
      try {
        key = this.key({ encryptedApiKey });
      } catch {
        throw new BadRequestException(
          'Vuelve a ingresar la clave de Gemini API.',
        );
      }
      const models = await this.gemini.models(key);
      if (!models.some((item) => item.id === input.geminiModel))
        throw new BadRequestException(
          'El modelo seleccionado no está disponible para esta clave.',
        );
    }
    const updated = await this.prisma.supportSettings.updateMany({
      where: { id: 'main', version: settings.version },
      data: {
        version: { increment: 1 },
        enabled: input.enabled !== false,
        aiEnabled,
        publicAiEnabled: input.publicAiEnabled === true,
        geminiModel: input.geminiModel,
        encryptedApiKey,
        dailyLimit: input.dailyLimit,
        welcomeMessage: input.welcomeMessage.trim(),
      },
    });
    if (updated.count !== 1)
      throw new ConflictException(
        'La configuración cambió. Actualiza antes de guardar.',
      );
    await this.prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'SUPPORT_SETTINGS_UPDATED',
        context: { actorId, aiEnabled },
      },
    });
    return this.configuration();
  }
  articles() {
    return this.prisma.supportArticle.findMany({
      orderBy: [{ sortOrder: 'asc' }, { question: 'asc' }],
    });
  }
  published(audience: 'PUBLIC' | 'ACCOUNT') {
    return this.prisma.supportArticle.findMany({
      where: { status: 'PUBLISHED', audience: { in: [audience, 'BOTH'] } },
      orderBy: [{ sortOrder: 'asc' }, { question: 'asc' }],
      take: 200,
    });
  }
  async saveArticle(id: string | null, input: any, actorId: string) {
    if (
      typeof input.question !== 'string' ||
      input.question.trim().length < 5 ||
      input.question.length > 180 ||
      typeof input.answer !== 'string' ||
      input.answer.trim().length < 10 ||
      input.answer.length > 6000 ||
      typeof input.category !== 'string' ||
      !input.category.trim() ||
      input.category.length > 60
    )
      throw new BadRequestException(
        'Completa una pregunta, una respuesta y una categoría dentro de los límites indicados.',
      );
    if (
      !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(input.status) ||
      !['PUBLIC', 'ACCOUNT', 'BOTH'].includes(input.audience) ||
      typeof input.isStarter !== 'boolean' ||
      !Number.isInteger(input.sortOrder) ||
      Math.abs(input.sortOrder) > 10000 ||
      !Array.isArray(input.aliases) ||
      input.aliases.length > 15 ||
      !input.aliases.every(
        (alias: unknown) =>
          typeof alias === 'string' && alias.length <= 180 && alias.trim(),
      )
    )
      throw new BadRequestException(
        'Revisa la publicación, visibilidad y preguntas alternativas.',
      );
    const data = {
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: input.category.trim(),
      aliases: input.aliases.map((alias: string) => alias.trim()),
      audience: input.audience,
      status: input.status,
      isStarter: input.isStarter,
      sortOrder: input.sortOrder,
    };
    let result;
    if (id) {
      if (!Number.isInteger(input.version))
        throw new BadRequestException('Falta la versión del artículo.');
      const updated = await this.prisma.supportArticle.updateMany({
        where: { id, version: input.version },
        data: { ...data, version: { increment: 1 } },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          'El artículo cambió o ya no existe. Actualiza antes de guardar.',
        );
      result = await this.prisma.supportArticle.findUnique({ where: { id } });
    } else {
      if ((await this.prisma.supportArticle.count()) >= 200)
        throw new BadRequestException(
          'Reutiliza artículos existentes: la base admite hasta 200 artículos.',
        );
      result = await this.prisma.supportArticle.create({ data });
    }
    await this.prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'SUPPORT_ARTICLE_SAVED',
        context: {
          actorId,
          articleId: result!.id,
          version: result!.version,
          status: result!.status,
        },
      },
    });
    return result;
  }
  async reserveAiCall() {
    const day = new Date().toISOString().slice(0, 10);
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRawUnsafe(
        'SELECT "id" FROM "SupportSettings" WHERE "id"=$1 FOR UPDATE',
        'main',
      );
      const settings = await tx.supportSettings.findUnique({
        where: { id: 'main' },
      });
      if (!settings?.enabled || !settings.aiEnabled) return false;
      const current = settings.usageDate === day ? settings.dailyCalls : 0;
      if (current >= settings.dailyLimit) return false;
      await tx.supportSettings.update({
        where: { id: 'main' },
        data: { usageDate: day, dailyCalls: current + 1 },
      });
      return true;
    });
  }
  async requireArticle(id: string, audience: 'PUBLIC' | 'ACCOUNT') {
    const article = await this.prisma.supportArticle.findFirst({
      where: { id, status: 'PUBLISHED', audience: { in: [audience, 'BOTH'] } },
    });
    if (!article)
      throw new NotFoundException(
        'La pregunta ya no está disponible. Actualiza el chat y elige otra.',
      );
    return article;
  }
}
