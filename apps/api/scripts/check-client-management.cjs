// Integration checks run ONLY against the disposable CI database and API.
// No production credentials, provider keys or real email recipients are used.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const db = new URL(process.env.DATABASE_URL || 'http://invalid');
if (process.env.NEXOPOS_CLIENT_CHECK !== '1' || db.hostname !== 'release-db' || db.pathname !== '/release_check') throw Error('This check requires the disposable release-db/release_check database.');
const base = 'http://release-api:3000/api';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { JwtService } = require('@nestjs/jwt');
const { io } = require('socket.io-client');
const prisma = new PrismaClient();
const id = () => crypto.randomUUID();
const password = 'Fixture-password-1842';
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log('PASS: ' + name); }
async function request(method, endpoint, token, data) {
  const response = await fetch(base + endpoint, {
    method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) },
    body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(90000),
  });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: response.status, body };
}
async function login(user, pass = password) {
  const r = await request('POST', '/auth/login', null, { email: user.email, password: pass });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert(r.body.access_token);
  return r.body.access_token;
}
async function fixture(name, role = 'TENANT_ADMIN') {
  const tenant = await prisma.tenant.create({ data: { id: id(), name, slug: name.toLowerCase() + '-' + id(), settings: { create: { maxUsers: 8, maxBranches: 3, enableEcommerce: false } } } });
  const branch = await prisma.branch.create({ data: { name: 'Matriz', tenantId: tenant.id, isMain: true, isActive: true } });
  const user = await prisma.user.create({ data: { name: 'Fixture ' + name, email: id() + '@example.invalid', password: await bcrypt.hash(password, 4), role, tenantId: tenant.id, branchId: branch.id } });
  return { tenant, branch, user };
}
async function counts(tenantId) {
  const out = {};
  for (const table of ['user', 'branch', 'product', 'category', 'brand', 'customer', 'supplier', 'sale', 'quote', 'credit', 'purchase', 'paymentTransaction', 'ecommerceConnection', 'ecommerceOrder', 'syncLog', 'tenantSettings', 'dteConfig', 'invoice', 'tenantModuleAddon', 'tenantModuleOverride', 'uploadAsset']) out[table] = await prisma[table].count({ where: { tenantId } });
  out.chats = await prisma.chatSession.count({ where: { visitorId: { startsWith: 'account:' + tenantId + ':' } } });
  return out;
}
(async () => {
  const codes = ['POS', 'QUOTES', 'CUSTOMERS', 'CREDITS', 'EXTRA_BRANCH', 'ECOMMERCE', 'TRANSBANK', 'SHOPIFY', 'WOOCOMMERCE', 'DTE_BOLETA', 'DTE_FACTURA', 'DTE_NOTA_CREDITO', 'DTE_GUIA_DESPACHO'];
  await prisma.module.createMany({ data: codes.map(code => ({ code, name: code })), skipDuplicates: true });
  const platform = await fixture('Platform', 'SUPER_ADMIN');
  const a = await fixture('ClientA');
  const b = await fixture('ClientB');
  const rootToken = await login(platform.user);
  let tokenA = await login(a.user);
  const tokenB = await login(b.user);
  let extra;
  let freshUser;
  await check('new registrations keep their main branch enabled', async () => {
    const r = await request('POST', '/auth/register-tenant', null, { companyName: 'Registration Fixture', userName: 'Fixture Owner', email: id() + '@example.invalid', password, phone: '+56900000000' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const branch = await prisma.branch.findUnique({ where: { id: r.body.branch.id } });
    assert(branch.isActive && branch.isMain);
  });
  await check('tenant users cannot open another customer record or create branches', async () => {
    assert.equal((await request('GET', '/admin/tenants/' + b.tenant.id, tokenA)).status, 403);
    assert.equal((await request('POST', '/branches', tokenA, { name: 'Unauthorized', tenantId: a.tenant.id })).status, 403);
    assert.equal((await request('POST', '/admin/tenants/' + a.tenant.id + '/branches', tokenA, { name: 'Unauthorized' })).status, 403);
  });
  await check('the customer record exposes counts and users without password hashes', async () => {
    const r = await request('GET', '/admin/tenants/' + a.tenant.id, rootToken);
    assert.equal(r.status, 200); assert.equal(r.body._count.users, 1);
    assert(!JSON.stringify(r.body).includes(a.user.password)); assert.equal(r.body.users[0].isActive, true);
    const own = await request('GET', '/tenants/' + a.tenant.id, tokenA);
    assert(!JSON.stringify(own.body).includes(a.user.password));
  });
  await check('DTE diagnostics are read-only, tenant-scoped and restricted to the superadmin', async () => {
    const records = [];
    const add = async (fixture, data) => { const row = await prisma.sale.create({ data: { tenantId: fixture.tenant.id, branchId: fixture.branch.id, total: 100, ...data } }); records.push(row.id); return row; };
    try {
      await add(a, { dteStatus: 'ERROR' });
      await add(a, { dteStatus: 'ACEPTADO', dteFolio: 123, dtePdfUrl: 'https://example.invalid/ejemplo-mock.pdf' });
      const pending = await add(a, { dteStatus: 'PENDIENTE_SII', dteProviderId: 'fixture-provider', dteFolio: 124, dteVerifiedAt: new Date() });
      const uncertain = await add(a, { dteStatus: 'PENDIENTE_CONFIRMACION' });
      for (const row of [pending, uncertain]) await prisma.dteSubmission.create({ data: { saleId: row.id, tenantId: a.tenant.id, tokenHash: 'fixture-private-token-hash', payload: { private: 'fixture-private-payload' } } });
      await add(b, { dteStatus: 'ERROR' }); await add(b, { dteStatus: 'ERROR' });
      const before = await counts(a.tenant.id);
      const endpoint = '/admin/tenants/' + a.tenant.id + '/dte-records';
      assert.equal((await request('GET', endpoint)).status, 401);
      assert.equal((await request('GET', endpoint, tokenA)).status, 403);
      assert.equal((await request('GET', '/admin/tenants/' + b.tenant.id + '/dte-records', tokenA)).status, 403);
      assert.equal((await request('GET', '/admin/tenants/' + id() + '/dte-records', rootToken)).status, 404);
      const result = await request('GET', endpoint, rootToken);
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.deepEqual({ ...result.body, reviewDocs: [] }, { confirmed: 1, unverified: 1, errors: 1, pending: 2, needsSupport: 1, reviewDocs: [] });
      assert.equal(result.body.reviewDocs.length, 1); assert.equal(result.body.reviewDocs[0].id, pending.id);
      assert(!JSON.stringify(result.body).includes('fixture-private'));
      const own = await request('GET', '/dte-config/stats', tokenA);
      assert.equal(own.status, 200); assert.deepEqual(own.body.local, result.body);
      assert.deepEqual(await counts(a.tenant.id), before);
    } finally { await prisma.sale.deleteMany({ where: { id: { in: records } } }); }
  });
  await check('search finds customers by user email and supports state filters', async () => {
    const r = await request('GET', '/admin/tenants?search=' + encodeURIComponent(a.user.email) + '&status=ACTIVE', rootToken);
    assert.equal(r.status, 200); assert(r.body.data.some(t => t.id === a.tenant.id)); assert(!r.body.data.some(t => t.id === b.tenant.id));
  });
  await check('only the superadmin creates and activates additional branches', async () => {
    const r = await request('POST', '/admin/tenants/' + a.tenant.id + '/branches', rootToken, { name: 'Additional', address: 'Fixture address' });
    assert.equal(r.status, 201, JSON.stringify(r.body)); extra = r.body; assert.equal(extra.isActive, false);
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/settings', rootToken, { maxBranches: 1 });
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/branches/' + extra.id, rootToken, { isActive: true })).status, 409);
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/settings', rootToken, { maxBranches: 3 });
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/branches/' + extra.id, rootToken, { isActive: true })).status, 200);
  });
  await check('branch edits are tenant-scoped and changing the main branch remains unique', async () => {
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/branches/' + b.branch.id, rootToken, { name: 'Wrong' })).status, 404);
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/branches/' + extra.id, rootToken, { isMain: true })).status, 200);
    assert.equal(await prisma.branch.count({ where: { tenantId: a.tenant.id, isMain: true } }), 1);
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/branches/' + a.branch.id, rootToken, { isMain: true });
  });
  await check('superadmin creates customer users and cannot assign branches from another tenant', async () => {
    const r = await request('POST', '/admin/tenants/' + a.tenant.id + '/users', rootToken, { name: 'Worker', email: id() + '@example.invalid', password, role: 'CASHIER', branchId: extra.id });
    assert.equal(r.status, 201, JSON.stringify(r.body)); freshUser = r.body; assert(!r.body.password);
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + freshUser.id, rootToken, { branchId: b.branch.id })).status, 400);
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + b.user.id, rootToken, { name: 'Wrong' })).status, 404);
  });
  let workerToken = await login(freshUser);
  await check('user disable revokes HTTP access and live sockets; reactivation restores login', async () => {
    const socket = io('http://release-api:3000/events', { auth: { token: workerToken, tenantId: a.tenant.id }, transports: ['websocket'] });
    try {
      await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Socket did not connect')), 10000); socket.once('connect', () => { clearTimeout(timer); resolve(); }); socket.once('connect_error', reject); });
      const disconnected = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Socket was not revoked')), 10000); socket.once('disconnect', () => { clearTimeout(timer); resolve(); }); });
      assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + freshUser.id, rootToken, { isActive: false })).status, 200);
      await disconnected;
      assert.equal((await request('GET', '/products', workerToken)).status, 401);
      await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + freshUser.id, rootToken, { isActive: true, role: 'MANAGER' });
      workerToken = await login(freshUser);
    } finally { socket.close(); }
  });
  await check('superadmin retains control of the sole customer administrator', async () => {
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + a.user.id, rootToken, { isActive: false })).status, 200);
    assert.equal((await request('GET', '/products', tokenA)).status, 401);
    assert.equal((await request('POST', '/admin/tenants/' + a.tenant.id + '/users/' + a.user.id + '/welcome-email', rootToken)).status, 404);
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + a.user.id, rootToken, { isActive: true });
    tokenA = await login(a.user);
  });
  await check('password resets invalidate previous tokens and never return the new password', async () => {
    const newPassword = 'Fixture-new-password-9841';
    const r = await request('PATCH', '/admin/tenants/' + a.tenant.id + '/users/' + freshUser.id, rootToken, { password: newPassword });
    assert.equal(r.status, 200); assert(!JSON.stringify(r.body).includes(newPassword)); assert.equal((await request('GET', '/products', workerToken)).status, 401);
    workerToken = await login(freshUser, newPassword);
  });
  const modules = await prisma.module.findMany();
  const byCode = Object.fromEntries(modules.map(m => [m.code, m]));
  await check('manual module decisions override included plan modules and can be reset', async () => {
    const plan = await prisma.plan.create({ data: { name: 'Fixture Plan', price: 0, maxUsers: 8, planModules: { create: [{ moduleId: byCode.QUOTES.id }, { moduleId: byCode.DTE_BOLETA.id }] } } });
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/plan', rootToken, { planId: plan.id })).status, 200);
    let r = await request('PATCH', '/admin/tenants/' + a.tenant.id + '/modules', rootToken, { overrides: [{ moduleId: byCode.QUOTES.id, enabled: false }, { moduleId: byCode.POS.id, enabled: true }] });
    assert.equal(r.status, 200); assert(r.body.allActive.some(m => m.code === 'DTE_BOLETA')); assert(!r.body.allActive.some(m => m.code === 'QUOTES'));
    assert.equal((await request('GET', '/quotes', tokenA)).status, 403);
    r = await request('PATCH', '/admin/tenants/' + a.tenant.id + '/modules', rootToken, { overrides: [{ moduleId: byCode.QUOTES.id, enabled: null }] });
    assert(r.body.allActive.some(m => m.code === 'QUOTES')); assert.equal((await request('GET', '/quotes', tokenA)).status, 200);
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/plan', rootToken, { planId: null });
  });
  await check('disabled ecommerce is unavailable publicly and public responses omit private access settings', async () => {
    const slug = 'fixture-store-' + a.tenant.id;
    await prisma.tenant.update({ where: { id: a.tenant.id }, data: { storeSlug: slug, storeSettings: { isActive: true } } });
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/modules', rootToken, { overrides: [{ moduleId: byCode.ECOMMERCE.id, enabled: true }] });
    const enabled = await request('GET', '/store/' + slug, null);
    assert.equal(enabled.status, 200, JSON.stringify(enabled.body));
    assert.equal(enabled.body.moduleOverrides, undefined); assert.equal(enabled.body.settings, undefined);
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/modules', rootToken, { overrides: [{ moduleId: byCode.ECOMMERCE.id, enabled: false }] });
    assert.equal((await request('GET', '/store/' + slug, null)).status, 404);
  });
  await check('superadmin can remove empty branches and users, while protecting the main branch', async () => {
    const branch = await request('POST', '/admin/tenants/' + a.tenant.id + '/branches', rootToken, { name: 'Empty fixture branch' });
    assert.equal(branch.status, 201);
    assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id + '/branches/' + branch.body.id, rootToken)).status, 200);
    assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id + '/branches/' + a.branch.id, rootToken)).status, 409);
    const user = await request('POST', '/admin/tenants/' + a.tenant.id + '/users', rootToken, { email: id() + '@example.invalid', name: 'Temporary user', password });
    assert.equal(user.status, 201);
    const token = await login(user.body);
    assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id + '/users/' + user.body.id, rootToken, { confirmation: user.body.email })).status, 200);
    assert.equal((await request('GET', '/products', token)).status, 401);
  });
  await check('customer API calls cannot activate addons, simulate plan changes or mint anonymous SSO sessions', async () => {
    assert.equal((await request('POST', '/modules/me/addons', tokenA, { moduleIds: [byCode.SHOPIFY.id] })).status, 403);
    assert.equal((await request('POST', '/tenants/' + a.tenant.id + '/change-plan-simulate', tokenA, { planId: null })).status, 403);
    assert.equal((await request('POST', '/auth/sso/token', null, { userId: a.user.id, tenantId: a.tenant.id })).status, 401);
    assert.equal((await request('POST', '/auth/sso/token', tokenA, { userId: b.user.id, tenantId: b.tenant.id })).status, 403);
  });
  await check('a stale privileged role in a signed token cannot grant superadmin rights', async () => {
    const signed = new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: a.user.id, tenantId: a.tenant.id, role: 'SUPER_ADMIN', tokenVersion: (await prisma.user.findUnique({ where: { id: a.user.id } })).tokenVersion });
    assert.equal((await request('GET', '/admin/tenants/' + b.tenant.id, signed)).status, 403);
  });
  await check('disabling a branch blocks new operations but allows closing its existing cash shift', async () => {
    const opened = await request('POST', '/shifts/open', tokenA, { branchId: extra.id, initialAmount: 0, userId: b.user.id, tenantId: a.tenant.id });
    assert.equal(opened.status, 201, JSON.stringify(opened.body)); assert.equal(opened.body.openedById, a.user.id);
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/branches/' + extra.id, rootToken, { isActive: false })).status, 200);
    assert.equal((await request('POST', '/shifts/open', tokenA, { branchId: extra.id, initialAmount: 0 })).status, 403);
    assert.equal((await request('POST', '/shifts/close', tokenA, { shiftId: opened.body.id, finalAmount: 0 })).status, 201);
    assert.equal((await request('GET', '/shifts/summary/' + opened.body.id, tokenB)).status, 403);
  });
  const privatePath = '/api/static/products/private-' + id() + '.png';
  const sharedPath = '/api/static/products/shared-' + id() + '.png';
  const uploadRoot = '/app/uploads';
  await fs.mkdir(path.join(uploadRoot, 'products'), { recursive: true });
  await fs.writeFile(path.join(uploadRoot, privatePath.slice('/api/static/'.length)), 'PRIVATE_FIXTURE');
  await fs.writeFile(path.join(uploadRoot, sharedPath.slice('/api/static/'.length)), 'SHARED_FIXTURE');
  const category = await prisma.category.create({ data: { tenantId: a.tenant.id, name: 'Fixture Category' } });
  const brand = await prisma.brand.create({ data: { tenantId: a.tenant.id, name: 'Fixture Brand' } });
  const supplier = await prisma.supplier.create({ data: { tenantId: a.tenant.id, name: 'Fixture Supplier' } });
  const customer = await prisma.customer.create({ data: { tenantId: a.tenant.id, name: 'Fixture Customer', rut: id() } });
  const product = await prisma.product.create({ data: { tenantId: a.tenant.id, name: 'Fixture Product', image: privatePath, galleryImages: [sharedPath], categoryId: category.id, brandId: brand.id, supplierId: supplier.id, priceTiers: { create: { minQuantity: 2, unitPrice: 80 } } } });
  const productB = await prisma.product.create({ data: { tenantId: b.tenant.id, name: 'Other Customer Product', image: sharedPath } });
  await prisma.uploadAsset.createMany({ data: [privatePath, sharedPath].map(p => ({ tenantId: a.tenant.id, path: p })) });
  await prisma.inventory.create({ data: { branchId: a.branch.id, productId: product.id, quantity: 3 } });
  await prisma.inventory.create({ data: { branchId: b.branch.id, productId: productB.id, quantity: 7 } });
  const quote = await prisma.quote.create({ data: { tenantId: a.tenant.id, customerId: customer.id, userId: a.user.id, items: { create: { productId: product.id, quantity: 1, price: 100, total: 100 } } } });
  const cashShift = await prisma.cashShift.create({ data: { branchId: a.branch.id, openedById: a.user.id, status: 'CLOSED', initialAmount: 0 } });
  const sale = await prisma.sale.create({ data: { tenantId: a.tenant.id, branchId: a.branch.id, userId: a.user.id, cashShiftId: cashShift.id, customerId: customer.id, quoteId: quote.id, total: 100, items: { create: { productId: product.id, quantity: 1, price: 100 } }, payments: { create: { amount: 100, paymentMethod: 'EFECTIVO' } } } });
  const credit = await prisma.credit.create({ data: { tenantId: a.tenant.id, customerId: customer.id, saleId: sale.id, totalAmount: 100, balance: 50, payments: { create: { amount: 50, paymentMethod: 'EFECTIVO', cashShiftId: cashShift.id } } } });
  await prisma.purchase.create({ data: { tenantId: a.tenant.id, branchId: a.branch.id, supplierId: supplier.id, items: { create: { productId: product.id, quantity: 2, costPrice: 50 } } } });
  await prisma.transfer.create({ data: { originBranchId: a.branch.id, destBranchId: extra.id, requestedById: a.user.id, processedById: freshUser.id, status: 'COMPLETED', items: { create: { productId: product.id, quantity: 1 } } } });
  await prisma.stockMovement.create({ data: { branchId: a.branch.id, productId: product.id, userId: a.user.id, quantity: 1, balance: 3, type: 'ADJUSTMENT' } });
  await prisma.paymentTransaction.create({ data: { tenantId: a.tenant.id, branchId: a.branch.id, orderId: id(), saleId: sale.id, amount: 100 } });
  const connection = await prisma.ecommerceConnection.create({ data: { tenantId: a.tenant.id, platform: 'SHOPIFY', name: 'Fixture Connection', isActive: false } });
  await prisma.productMapping.create({ data: { connectionId: connection.id, nexoposProductId: product.id, externalId: id() } });
  await prisma.registeredWebhook.create({ data: { connectionId: connection.id, topic: 'fixture', externalId: id(), callbackUrl: 'https://example.invalid', isActive: false } });
  await prisma.ecommerceOrder.create({ data: { tenantId: a.tenant.id, connectionId: connection.id, externalId: id(), platform: 'SHOPIFY', rawData: {} } });
  await prisma.syncLog.create({ data: { tenantId: a.tenant.id, connectionId: connection.id, entityType: 'PRODUCT', direction: 'PUSH', status: 'SUCCESS' } });
  await prisma.dteConfig.create({ data: { tenantId: a.tenant.id } });
  await prisma.invoice.create({ data: { tenantId: a.tenant.id, amount: 100, dueDate: new Date() } });
  await prisma.tenantModuleAddon.create({ data: { tenantId: a.tenant.id, moduleId: byCode.ECOMMERCE.id } });
  const ownSupportAlert = await prisma.systemNotification.create({ data: { title: 'Fixture support', message: 'Private fixture support', type: 'CHAT' } });
  const otherSupportAlert = await prisma.systemNotification.create({ data: { title: 'Unrelated fixture alert', message: 'Preserve unrelated data', type: 'CHAT' } });
  const ownSupport = await prisma.chatSession.create({ data: { visitorId: 'account:' + a.tenant.id + ':' + a.user.id, messages: { create: { sender: 'VISITOR', content: 'Fixture internal support' } }, notices: { create: { cycle: 1, title: 'Fixture support', message: 'Private fixture support', notificationId: ownSupportAlert.id } } } });
  await fs.mkdir(path.join(uploadRoot, 'receipts', a.tenant.id), { recursive: true });
  await fs.writeFile(path.join(uploadRoot, 'receipts', a.tenant.id, 'fixture.pdf'), 'FIXTURE_RECEIPT');
  let unlinkedPath;
  await check('new uploads register ownership even before a product uses the file', async () => {
    const form = new FormData(); form.append('file', new Blob([Buffer.from('PNG_FIXTURE')], { type: 'image/png' }), 'fixture.png');
    const r = await fetch(base + '/uploads/image', { method: 'POST', headers: { Authorization: 'Bearer ' + tokenA }, body: form });
    assert.equal(r.status, 201); const body = await r.json(); unlinkedPath = body.url;
    assert.equal((await prisma.uploadAsset.findUnique({ where: { path: body.url } })).tenantId, a.tenant.id);
  });
  await check('suspending the company blocks its existing sessions and reactivation restores access', async () => {
    assert.equal((await request('PATCH', '/admin/tenants/' + a.tenant.id + '/status', rootToken, { status: 'SUSPENDED' })).status, 200);
    assert([401, 403].includes((await request('GET', '/products', tokenA)).status));
    await request('PATCH', '/admin/tenants/' + a.tenant.id + '/status', rootToken, { status: 'ACTIVE' });
    assert.equal((await request('GET', '/products', tokenA)).status, 401);
    tokenA = await login(a.user);
    assert.equal((await request('GET', '/products', tokenA)).status, 200);
  });
  const preview = await request('GET', '/admin/tenants/' + a.tenant.id + '/deletion-preview', rootToken);
  const deletion = { confirmation: preview.body.confirmation, password };
  await check('deletion requires the exact phrase and superadmin password and protects platform accounts', async () => {
    assert(preview.body.counts.sales > 0 && preview.body.counts.users > 0);
    assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id, rootToken, { ...deletion, password: 'wrong-password' })).status, 403);
    assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id, rootToken, { ...deletion, confirmation: 'WRONG' })).status, 400);
    assert.equal((await request('DELETE', '/admin/tenants/' + platform.tenant.id, rootToken, { confirmation: 'ELIMINAR ' + platform.tenant.slug, password })).status, 403);
    assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id, tokenA, deletion)).status, 403);
  });
  const bBefore = await counts(b.tenant.id);
  await check('cross-tenant references stop deletion without changing either customer', async () => {
    const cross = await prisma.inventory.create({ data: { branchId: b.branch.id, productId: product.id, quantity: 1 } });
    const before = await counts(a.tenant.id);
    const r = await request('DELETE', '/admin/tenants/' + a.tenant.id, rootToken, deletion);
    assert.equal(r.status, 409, JSON.stringify(r.body)); assert.deepEqual(await counts(a.tenant.id), before); assert.deepEqual(await counts(b.tenant.id), bBefore);
    await prisma.inventory.delete({ where: { id: cross.id } });
  });
  await check('a late database failure rolls back the whole account deletion and keeps its files', async () => {
    const before = await counts(a.tenant.id);
    await prisma.$executeRawUnsafe("CREATE FUNCTION fixture_block_delete() RETURNS trigger AS $$ BEGIN IF OLD.id = '" + a.tenant.id + "' THEN RAISE EXCEPTION 'fixture deletion blocked'; END IF; RETURN OLD; END; $$ LANGUAGE plpgsql");
    await prisma.$executeRawUnsafe('CREATE TRIGGER fixture_block_delete_trigger BEFORE DELETE ON "Tenant" FOR EACH ROW EXECUTE FUNCTION fixture_block_delete()');
    try {
      assert.equal((await request('DELETE', '/admin/tenants/' + a.tenant.id, rootToken, deletion)).status, 500);
      assert.deepEqual(await counts(a.tenant.id), before); assert.deepEqual(await counts(b.tenant.id), bBefore);
      await fs.access(path.join(uploadRoot, privatePath.slice('/api/static/'.length)));
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER fixture_block_delete_trigger ON "Tenant"');
      await prisma.$executeRawUnsafe('DROP FUNCTION fixture_block_delete()');
    }
  });
  await check('complete deletion removes the full operational graph and unreferenced files, preserving other customers', async () => {
    const r = await request('DELETE', '/admin/tenants/' + a.tenant.id, rootToken, deletion);
    assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.deleted, true); assert.equal(r.body.cleanup.pending, 0);
    assert.equal(await prisma.tenant.findUnique({ where: { id: a.tenant.id } }), null);
    assert(Object.values(await counts(a.tenant.id)).every(n => n === 0));
    for (const table of ['saleItem', 'payment', 'quoteItem', 'creditPayment', 'purchaseItem', 'transfer', 'transferItem', 'cashShift', 'inventory', 'stockMovement', 'productMapping', 'registeredWebhook', 'productPriceTier']) {
      // These fixture tables contain A's rows only, except the explicitly preserved inventory of B.
      assert.equal(await prisma[table].count(), table === 'inventory' ? 1 : 0, table);
    }
    await assert.rejects(fs.access(path.join(uploadRoot, privatePath.slice('/api/static/'.length))));
    await assert.rejects(fs.access(path.join(uploadRoot, unlinkedPath.slice('/api/static/'.length))));
    await assert.rejects(fs.access(path.join(uploadRoot, 'receipts', a.tenant.id)));
    await fs.access(path.join(uploadRoot, sharedPath.slice('/api/static/'.length)));
    assert.deepEqual(await counts(b.tenant.id), bBefore);
    assert.equal(await prisma.supportHandoffNotice.count({ where: { chatSessionId: ownSupport.id } }), 0);
    assert.equal(await prisma.systemNotification.findUnique({ where: { id: ownSupportAlert.id } }), null);
    assert(await prisma.systemNotification.findUnique({ where: { id: otherSupportAlert.id } }));
    assert.equal((await request('GET', '/products', tokenA)).status, 401);
    assert.equal((await request('GET', '/products', tokenB)).status, 200);
    const audit = await prisma.systemLog.findFirst({ where: { message: 'CLIENT_ACCOUNT_DELETED', context: { path: ['deletedTenantId'], equals: a.tenant.id } } });
    assert(audit && !JSON.stringify(audit).includes(password));
  });
  await fs.mkdir('/checks-results', { recursive: true });
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, tenantId: u.tenantId, branchId: u.branchId, modules: ['POS', 'QUOTES', 'CUSTOMERS', 'CREDITS'] });
  await fs.writeFile('/checks-results/context.json', JSON.stringify({ rootToken, rootUser: publicUser(platform.user), customerToken: tokenB, customerUser: publicUser(b.user), customerId: b.tenant.id }));
  console.log('CLIENT_MANAGEMENT_CHECKS=' + checks);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
