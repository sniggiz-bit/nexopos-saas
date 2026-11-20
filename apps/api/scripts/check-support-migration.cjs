const assert = require('node:assert/strict');
const db = new URL(process.env.DATABASE_URL || 'http://invalid');
if (
  process.env.NEXOPOS_SUPPORT_CHECK !== '1' ||
  db.hostname !== 'release-db' ||
  db.pathname !== '/migration_check'
)
  throw Error('Disposable migration database required.');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  if (process.argv[2] === 'before') {
    for (const status of ['ACTIVE', 'CLOSED'])
      await p.$executeRawUnsafe(
        'INSERT INTO "ChatSession" ("id","visitorId","status","updatedAt") VALUES ($1,$2,$3,NOW())',
        'old-' + status,
        'visitor-' + status,
        status,
      );
    await p.$executeRawUnsafe(
      'INSERT INTO "ChatMessage" ("id","chatSessionId","sender","content","createdAt") VALUES ($1,$2,$3,$4,$5)',
      'old-message-1',
      'old-ACTIVE',
      'VISITOR',
      'Consulta histórica ficticia',
      new Date('2020-01-01'),
    );
    await p.$executeRawUnsafe(
      'INSERT INTO "ChatMessage" ("id","chatSessionId","sender","content","createdAt") VALUES ($1,$2,$3,$4,$5)',
      'old-message-2',
      'old-ACTIVE',
      'ADMIN',
      'Respuesta histórica ficticia',
      new Date('2020-01-02'),
    );
  } else {
    const active = await p.chatSession.findUnique({
      where: { id: 'old-ACTIVE' },
      include: { messages: { orderBy: { sequence: 'asc' } } },
    });
    assert.equal(active.mode, 'WAITING_HUMAN');
    assert.equal(active.messageSequence, 2);
    assert.deepEqual(
      active.messages.map((message) => message.sequence),
      [1, 2],
    );
    assert.equal(active.messages[1].sender, 'ADMIN');
    assert.equal(
      (await p.chatSession.findUnique({ where: { id: 'old-CLOSED' } })).mode,
      'RESOLVED',
    );
    assert.equal(
      (await p.chatSession.create({ data: { visitorId: 'new-fixture' } })).mode,
      'BOT',
    );
    const settings = await p.supportSettings.findUnique({
      where: { id: 'main' },
    });
    assert.equal(settings.aiEnabled, false);
    assert.equal(settings.encryptedApiKey, null);
    assert.equal(
      await p.supportArticle.count({ where: { status: 'PUBLISHED' } }),
      9,
    );
    console.log(
      'PASS: additive support migration preserves history, pauses legacy bots and seeds scoped topics with Gemini disabled',
    );
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
