const assert = require('node:assert/strict');
const db = new URL(process.env.DATABASE_URL || 'http://invalid');
if (process.env.NEXOPOS_CLIENT_CHECK !== '1' || db.hostname !== 'release-db' || db.pathname !== '/migration_check') throw Error('Disposable migration_check database required.');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  if (process.argv[2] === 'before') {
    await prisma.$executeRawUnsafe('INSERT INTO "Tenant" ("id","name","slug","updatedAt") VALUES ($1,$2,$3,NOW())', 'migration-tenant', 'Legacy fixture', 'legacy-fixture');
    await prisma.$executeRawUnsafe('INSERT INTO "User" ("id","email","tenantId","updatedAt") VALUES ($1,$2,$3,NOW())', 'migration-user', 'migration@example.invalid', 'migration-tenant');
  } else {
    const user = await prisma.user.findUnique({ where: { id: 'migration-user' } });
    assert.equal(user.isActive, true);
    assert.equal(user.tokenVersion, 0);
    assert.equal(await prisma.tenantModuleOverride.count(), 0);
    assert.equal(await prisma.uploadAsset.count(), 0);
    console.log('PASS: migration preserves existing users and adds empty override/asset tables');
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
