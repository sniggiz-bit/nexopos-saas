// Isolated database and fake providers only. Never contact Google or Resend.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const db = new URL(process.env.DATABASE_URL || 'http://invalid');
if (
  process.env.NEXOPOS_SUPPORT_CHECK !== '1' ||
  db.hostname !== 'release-db' ||
  db.pathname !== '/release_check'
)
  throw Error('Disposable support check database required.');
const { PrismaClient } = require('@prisma/client');
const { SupportService } = require('../dist/support/support.service');
const {
  SupportKnowledgeService,
} = require('../dist/support/support-knowledge.service');
const {
  SupportNoticeWorker,
} = require('../dist/support/support-notice.worker');
const prisma = new PrismaClient();
process.env.SUPPORT_ENCRYPTION_KEY = 'fixture-support-master-encryption-key';
global.fetch = (() => {
  const original = global.fetch;
  return (url, init) => {
    if (!String(url).startsWith('http://release-api:3000/api/'))
      throw Error('External network forbidden in support checks');
    return original(url, init);
  };
})();
const calls = [];
const events = [];
let modelAnswer = async (input) => ({
  action: 'answer',
  text: 'Respuesta ficticia respaldada.',
  sourceIds: [input.articles[0].id],
  sourceVersions: { [input.articles[0].id]: input.articles[0].version },
});
const gemini = {
  models: async () => [{ id: 'gemini-fixture', name: 'Fixture model' }],
  answer: (input) => modelAnswer(input),
};
const knowledge = new SupportKnowledgeService(prisma, gemini);
const gateway = { emitToTenant: (...args) => events.push(args) };
const support = new SupportService(prisma, knowledge, gemini, gateway);
let failMail = false;
const notifications = {
  sendEmailNotification: async (...args) => {
    calls.push(args);
    return failMail
      ? { status: 'FAILED', error: 'Fixture provider unavailable' }
      : { status: 'ACCEPTED', providerId: 'fixture-provider-id' };
  },
};
const worker = new SupportNoticeWorker(prisma, notifications, support, gateway);
let checks = 0;
async function check(name, fn) {
  await fn();
  checks++;
  console.log('PASS: ' + name);
}
async function request(method, path, token, data) {
  const response = await fetch('http://release-api:3000/api' + path, {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: response.status, data: await response.json() };
}
const turn = (visitor, message, rest = {}) =>
  support.publicTurn(visitor, {
    message,
    clientMessageId: randomUUID(),
    ...rest,
  });
(async () => {
  const fixture = JSON.parse(
    await fs.readFile('/checks-results/context.json', 'utf8'),
  );
  const admin = fixture.rootUser.id;
  const article = await knowledge.saveArticle(
    null,
    {
      question: '¿Cómo ingreso un producto de prueba?',
      answer:
        'En Productos, completa los campos requeridos y agrega una imagen principal.',
      category: 'Productos',
      aliases: ['crear producto'],
      status: 'PUBLISHED',
      audience: 'BOTH',
      isStarter: true,
      sortOrder: 1,
    },
    admin,
  );
  const draft = await knowledge.saveArticle(
    null,
    {
      ...article,
      question: 'Pregunta privada de prueba',
      answer: 'BORRADOR_PRIVADO_NO_PUBLICAR',
      status: 'DRAFT',
    },
    admin,
  );
  const accountOnly = await knowledge.saveArticle(
    null,
    {
      ...article,
      question: 'Pregunta exclusiva de clientes',
      audience: 'ACCOUNT',
    },
    admin,
  );
  await check(
    'admin routes reject customers and settings never expose the encrypted key',
    async () => {
      for (const path of ['/support/articles', '/support/settings'])
        assert.equal(
          (await request('GET', path, fixture.customerToken)).status,
          403,
        );
      assert.equal(
        (
          await request(
            'POST',
            '/support/check-gemini',
            fixture.customerToken,
            {},
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            'POST',
            '/support/conversations/' + randomUUID() + '/action',
            fixture.customerToken,
            { action: 'claim' },
          )
        ).status,
        403,
      );
      let settings = await knowledge.configuration();
      settings = await knowledge.updateSettings(
        {
          ...settings,
          apiKey: 'fixture-gemini-key-never-real',
          geminiModel: 'gemini-fixture',
          aiEnabled: false,
        },
        admin,
      );
      assert(settings.keyConfigured);
      assert(!JSON.stringify(settings).includes('fixture-gemini-key'));
      const stored = await prisma.supportSettings.findUnique({
        where: { id: 'main' },
      });
      assert(stored.encryptedApiKey);
      assert(!stored.encryptedApiKey.includes('fixture-gemini-key'));
      const response = await request(
        'GET',
        '/support/settings',
        fixture.rootToken,
      );
      assert.equal(response.status, 200);
      assert(!JSON.stringify(response.data).includes('encryptedApiKey'));
    },
  );
  await check(
    'only published articles in the correct audience are visible',
    async () => {
      const history = await support.publicHistory(null);
      assert(history.suggestions.some((item) => item.id === article.id));
      assert(
        !history.suggestions.some((item) =>
          [draft.id, accountOnly.id].includes(item.id),
        ),
      );
      await assert.rejects(
        turn(randomUUID(), 'privada', { articleId: draft.id }),
      );
      await assert.rejects(
        turn(randomUUID(), 'privada', { articleId: accountOnly.id }),
      );
      const before = await prisma.supportHandoffNotice.count();
      const response = await turn(randomUUID(), article.question, {
        articleId: article.id,
      });
      assert.equal(response.mode, 'BOT');
      assert.equal(response.messages.length, 2);
      assert.equal(response.messages[1].sources[0].version, 1);
      assert.equal(await prisma.supportHandoffNotice.count(), before);
    },
  );
  await check(
    'duplicate messages produce one visitor turn and one answer with strict sequence ordering',
    async () => {
      const visitor = randomUUID();
      const input = {
        message: 'crear producto',
        clientMessageId: randomUUID(),
      };
      const [a, b] = await Promise.all([
        support.publicTurn(visitor, input),
        support.publicTurn(visitor, input),
      ]);
      const history = await support.publicHistory(visitor);
      assert.equal(a.sessionId, b.sessionId);
      assert.equal(history.messages.length, 2);
      assert.deepEqual(
        history.messages.map((item) => item.sequence),
        [1, 2],
      );
    },
  );
  await check(
    'one clarification is followed by human handoff with one durable notice',
    async () => {
      const visitor = randomUUID();
      const first = await turn(visitor, 'Consulta sin tema conocido');
      assert.equal(first.mode, 'BOT');
      const second = await turn(visitor, 'Sigue sin quedar claro');
      assert.equal(second.mode, 'WAITING_HUMAN');
      assert.equal(
        await prisma.supportHandoffNotice.count({
          where: { chatSessionId: second.sessionId },
        }),
        1,
      );
      const count = second.messages.filter(
        (item) => item.sender === 'BOT',
      ).length;
      const waiting = await turn(visitor, 'Agrego detalles de mi caso');
      assert.equal(
        waiting.messages.filter((item) => item.sender === 'BOT').length,
        count,
      );
      assert.equal(
        await prisma.supportHandoffNotice.count({
          where: { chatSessionId: second.sessionId },
        }),
        1,
      );
    },
  );
  let internal;
  await check(
    'internal handoff identifies the real user and company and customer histories are isolated',
    async () => {
      const actor = await support.account({
        user: { sub: fixture.customerUser.id, tenantId: fixture.customerId },
      });
      internal = await support.accountTurn(actor, {
        message: 'Necesito hablar con una persona',
        intent: 'human',
        clientMessageId: randomUUID(),
      });
      assert.equal(internal.mode, 'WAITING_HUMAN');
      const notice = await prisma.supportHandoffNotice.findFirst({
        where: { chatSessionId: internal.sessionId },
      });
      assert.equal(notice.title, 'Usuario de NexoPOS solicita soporte');
      assert(notice.message.includes(actor.email));
      assert(notice.message.includes(actor.company));
      const own = await request('GET', '/support/chat', fixture.customerToken);
      const other = await request('GET', '/support/chat', fixture.rootToken);
      assert.equal(own.data.sessionId, internal.sessionId);
      assert.notEqual(other.data.sessionId, internal.sessionId);
      await assert.rejects(
        support.publicHistory(
          'account:' + fixture.customerId + ':' + fixture.customerUser.id,
        ),
      );
      await assert.rejects(
        support.account({
          user: {
            sub: fixture.customerUser.id,
            tenantId: fixture.rootUser.tenantId,
          },
        }),
      );
    },
  );
  await check(
    'outbox is exclusive, retries use the same idempotency key and deep link',
    async () => {
      // Isolate one pending notice for deterministic mail checks.
      await prisma.supportHandoffNotice.updateMany({
        where: { chatSessionId: { not: internal.sessionId } },
        data: { status: 'ACCEPTED' },
      });
      failMail = true;
      await Promise.all([worker.drainOnce(), worker.drainOnce()]);
      assert.equal(calls.length, 1);
      assert.equal(
        calls[0][4],
        '/admin/live-chats?session=' + internal.sessionId,
      );
      const notice = await prisma.supportHandoffNotice.findFirst({
        where: { chatSessionId: internal.sessionId },
      });
      assert.equal(notice.status, 'RETRY');
      await prisma.supportHandoffNotice.update({
        where: { id: notice.id },
        data: { nextAttemptAt: new Date(0) },
      });
      failMail = false;
      await worker.drainOnce();
      assert.equal(calls.length, 2);
      assert.equal(calls[0][5], calls[1][5]);
      assert(calls[0][5].startsWith('support-handoff/'));
      await worker.drainOnce();
      assert.equal(calls.length, 2);
      assert.equal(
        (
          await prisma.supportHandoffNotice.findUnique({
            where: { id: notice.id },
          })
        ).status,
        'ACCEPTED',
      );
    },
  );
  await check(
    'claim pauses the assistant and resolving reopens a new support cycle',
    async () => {
      const visitor = randomUUID();
      const first = await turn(visitor, 'Hablar con humano');
      await support.adminAction(first.sessionId, 'claim', admin);
      const history = await turn(visitor, 'crear producto');
      assert.equal(history.mode, 'HUMAN');
      assert.equal(
        history.messages.filter((item) => item.sender === 'BOT').length,
        1,
      );
      await support.adminReply(
        first.sessionId,
        'Te ayudo personalmente.',
        admin,
      );
      assert.equal(
        (await support.publicHistory(visitor)).messages.at(-1).sender,
        'ADMIN',
      );
      await support.adminAction(first.sessionId, 'resolve', admin);
      assert.equal((await support.publicHistory(visitor)).mode, 'RESOLVED');
      const reopened = await turn(visitor, 'Hablar con humano');
      assert.equal(reopened.mode, 'WAITING_HUMAN');
      assert.equal(
        await prisma.supportHandoffNotice.count({
          where: { chatSessionId: first.sessionId },
        }),
        2,
      );
    },
  );
  await check(
    'stale processing is recovered as a durable human request',
    async () => {
      const visitor = randomUUID();
      const session = await prisma.chatSession.create({
        data: {
          visitorId: visitor,
          mode: 'BOT',
          pendingMessageId: randomUUID(),
          pendingSince: new Date(Date.now() - 60000),
        },
      });
      await support.expireOne(session.id);
      assert.equal(
        (await prisma.chatSession.findUnique({ where: { id: session.id } }))
          .mode,
        'WAITING_HUMAN',
      );
      assert.equal(
        await prisma.supportHandoffNotice.count({
          where: { chatSessionId: session.id },
        }),
        1,
      );
    },
  );
  await check('Gemini calls respect the atomic daily budget', async () => {
    await prisma.supportSettings.update({
      where: { id: 'main' },
      data: {
        aiEnabled: true,
        publicAiEnabled: true,
        geminiModel: 'gemini-fixture',
        dailyLimit: 2,
        usageDate: '',
        dailyCalls: 0,
      },
    });
    const reservations = await Promise.all(
      Array.from({ length: 8 }, () => knowledge.reserveAiCall()),
    );
    assert.equal(reservations.filter(Boolean).length, 2);
    await prisma.supportSettings.update({
      where: { id: 'main' },
      data: { dailyLimit: 100, dailyCalls: 0 },
    });
  });
  await check('human takeover discards a late model answer', async () => {
    const visitor = randomUUID();
    let release;
    let started;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    modelAnswer = async (input) => {
      started();
      await new Promise((resolve) => {
        release = resolve;
      });
      return {
        action: 'answer',
        text: 'LATE_MODEL_ANSWER',
        sourceIds: [article.id],
        sourceVersions: { [article.id]: article.version },
      };
    };
    const pending = turn(visitor, 'Mi producto tiene un problema al guardar');
    await ready;
    const session = await prisma.chatSession.findFirst({
      where: { visitorId: visitor },
    });
    await support.adminAction(session.id, 'claim', admin);
    release();
    const response = await pending;
    assert.equal(response.mode, 'HUMAN');
    assert(
      !response.messages.some(
        (message) => message.content === 'LATE_MODEL_ANSWER',
      ),
    );
  });
  await check(
    'a changed article version invalidates an in-flight model answer',
    async () => {
      let release;
      let started;
      const ready = new Promise((resolve) => {
        started = resolve;
      });
      const visitor = randomUUID();
      modelAnswer = async (input) => {
        started();
        await new Promise((resolve) => {
          release = resolve;
        });
        return {
          action: 'answer',
          text: 'STALE_ARTICLE_ANSWER',
          sourceIds: [article.id],
          sourceVersions: { [article.id]: 1 },
        };
      };
      const pending = turn(
        visitor,
        'El producto muestra un problema de imagen',
      );
      await ready;
      await prisma.supportArticle.update({
        where: { id: article.id },
        data: { version: { increment: 1 } },
      });
      release();
      const response = await pending;
      assert.equal(response.mode, 'WAITING_HUMAN');
      assert(
        !response.messages.some(
          (message) => message.content === 'STALE_ARTICLE_ANSWER',
        ),
      );
    },
  );
  await check(
    'provider failures safely transfer to humans instead of inventing answers',
    async () => {
      modelAnswer = async () => {
        throw Error('PRIVATE_PROVIDER_FAILURE');
      };
      const response = await turn(
        randomUUID(),
        'Necesito revisar un producto que falla',
      );
      assert.equal(response.mode, 'WAITING_HUMAN');
      assert(!JSON.stringify(response).includes('PRIVATE_PROVIDER_FAILURE'));
    },
  );
  await check(
    'old public conversations retain their history even when session and visitor IDs differ',
    async () => {
      const visitor = randomUUID();
      const old = await prisma.chatSession.create({
        data: { visitorId: visitor, mode: 'WAITING_HUMAN' },
      });
      const response = await turn(visitor, 'Un detalle adicional');
      assert.equal(response.sessionId, old.id);
      assert.equal(
        await prisma.chatSession.count({ where: { visitorId: visitor } }),
        1,
      );
    },
  );
  await check(
    'selected email destination is returned even outside the first hundred chats',
    async () => {
      const old = await prisma.chatSession.create({
        data: {
          visitorId: randomUUID(),
          status: 'CLOSED',
          mode: 'RESOLVED',
          updatedAt: new Date(0),
        },
      });
      await prisma.chatSession.createMany({
        data: Array.from({ length: 101 }, () => ({
          visitorId: randomUUID(),
          mode: 'BOT',
        })),
      });
      assert(
        (await support.sessions(old.id, 'BOT')).some(
          (session) => session.id === old.id,
        ),
      );
    },
  );
  await prisma.chatSession.deleteMany({
    where: {
      visitorName: 'Visitante Anónimo',
      messages: { none: {} },
      notices: { none: {} },
    },
  });
  await prisma.supportSettings.update({
    where: { id: 'main' },
    data: {
      aiEnabled: false,
      publicAiEnabled: false,
      encryptedApiKey: null,
      geminiModel: '',
      dailyCalls: 0,
    },
  });
  console.log(
    'SUPPORT_ASSISTANT_CHECKS=' +
      checks +
      '; external emails and Gemini requests=0',
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.supportSettings.updateMany({
      data: {
        aiEnabled: false,
        publicAiEnabled: false,
        encryptedApiKey: null,
        geminiModel: '',
      },
    });
    await prisma.$disconnect();
  });
