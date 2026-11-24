const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const db = new URL(process.env.DATABASE_URL || 'http://invalid');
if (process.env.NEXOPOS_LIOREN_CHECK !== '1' || db.hostname !== 'release-db' || db.pathname !== '/release_check') throw Error('Disposable release_check database required.');
const { PrismaClient } = require('@prisma/client');
const { LiorenService } = require('../dist/dte/lioren.service');
const { LiorenApiError, chileDate } = require('../dist/dte/lioren-api.service');
const { LiorenAccountService } = require('../dist/dte/lioren-account.service');
const { DteService } = require('../dist/dte/dte.service');
const { DteConfigService } = require('../dist/dte-config/dte-config.service');
const { SalesService } = require('../dist/sales/sales.service');
const { InventoryService } = require('../dist/inventory/inventory.service');
const prisma = new PrismaClient();
const token = 'fixture-lioren-token-never-sent';
let checks = 0;
async function check(name, run) { await run(); checks++; console.log('PASS: ' + name); }
(async () => {
  const context = JSON.parse(await fs.readFile('/checks-results/context.json', 'utf8'));
  const company = { rut: '76000000-0', name: 'Empresa ficticia', resolution: '80', resolutionDate: '2020-01-01', validFrom: '2020-01-01', validTo: '2099-01-01' };
  const tenant = await prisma.tenant.create({ data: { name: 'El servicio de facturación isolated fixture', slug: randomUUID(), rut: company.rut, dteConfig: { create: { liorenToken: token, dteResolution: '80', resolutionDate: new Date('2020-01-01') } }, settings: { create: { enableBoletaDte: true, enableFacturaDte: true, enableNotaCreditoDte: true, enableGuiaDespachoDte: true } } } });
  const branch = await prisma.branch.create({ data: { tenantId: tenant.id, name: 'Matriz de prueba', isMain: true, isActive: true } });
  const customer = await prisma.customer.create({ data: { tenantId: tenant.id, name: 'Receptor ficticio', rut: '11111111-1', giro: 'Actividad ficticia', address: 'Dirección ficticia 123', comuna: 'Providencia', city: 'Santiago' } });
  const product = await prisma.product.create({ data: { tenantId: tenant.id, name: 'Producto ficticio', price: 119 } });
  await prisma.inventory.create({ data: { branchId: branch.id, productId: product.id, quantity: 8 } });
  let mode = 'normal'; let notesEnabled = true; let posts = 0; let folio = 1000; let accepted = false; const issued = new Map(); const payloads = [];
  const api = {
    company: async () => company,
    types: async () => [39, 33, 61, 52].map(type => ({ type, label: 'Documento ficticio', providerActive: true, available: type === 61 && !notesEnabled ? 0 : 100, nextFolio: type === 61 && !notesEnabled ? null : 1001 })),
    get: async (_token, endpoint) => endpoint === 'comunas' ? [{ id: 1, nombre: 'Providencia', region_id: 13 }] : endpoint === 'ciudades' ? [{ id: 2, nombre: 'Santiago' }] : [{ id: 1, nombre: 'Anula documento' }],
    issue: async (key, type, payload, id) => {
      assert.equal(key, token); assert.match(id, /^[a-f0-9-]{36}$/); posts++; payloads.push(payload);
      await new Promise(resolve => setTimeout(resolve, 20));
      if (mode === 'network') throw new LiorenApiError(null, true);
      if (mode === 'malformed') return { id: 4 };
      const total = Math.round(payload.detalles.reduce((sum, item) => sum + item.precio * item.cantidad - (item.descuento || 0), 0) * (type === 39 ? 1 : 1.19));
      const response = { id: ++folio, tipodoc: String(type), folio, fecha: chileDate(), montototal: total, estado: accepted ? 'acepta' : 'pendiente' };
      issued.set(type + ':' + folio, response); return response;
    },
    document: async (_token, type, number) => ({ ...issued.get(type + ':' + number), estado: accepted ? 'acepta' : 'pendiente' }),
    pdfBuffer: () => Buffer.from('%PDF-1.4 fixture'),
  };
  const account = new LiorenAccountService(prisma, api);
  const lioren = new LiorenService(prisma, api, account);
  const dte = new DteService(lioren, prisma);
  const inventory = new InventoryService(prisma);
  const currentInventory = async () => Number((await prisma.inventory.findUnique({ where: { productId_branchId: { productId: product.id, branchId: branch.id } } })).quantity);
  const sales = new SalesService(prisma, dte, {}, {}, inventory, {}, {});
  const sale = (extra = {}) => prisma.sale.create({ data: { tenantId: tenant.id, branchId: branch.id, customerId: customer.id, total: 238, dteType: 39, items: { create: { productId: product.id, quantity: 2, price: 119 } }, ...extra } });
  await check('simultaneous emission requests persist exactly one submission and one provider POST', async () => {
    const row = await sale(); const before = posts;
    await Promise.all([lioren.emitirBoleta(row.id), lioren.emitirBoleta(row.id)]);
    assert.equal(posts - before, 1); assert.equal(await prisma.dteSubmission.count({ where: { saleId: row.id } }), 1);
    const stored = await prisma.sale.findUnique({ where: { id: row.id } }); assert.equal(stored.dteStatus, 'PENDIENTE_SII'); assert(stored.dteVerifiedAt); assert(!stored.dtePdfUrl.includes('ejemplo-mock'));
    await lioren.emitirBoleta(row.id); assert.equal(posts - before, 1);
  });
  await check('an inactive branch blocks submission even after provider preflight succeeds', async () => {
    const inactive = await prisma.branch.create({ data: { tenantId: tenant.id, name: 'Sucursal inactiva de prueba', isActive: false } });
    const row = await sale({ branchId: inactive.id }); const before = posts;
    assert.equal((await lioren.emitirBoleta(row.id)).status, 'BLOQUEADO'); assert.equal(posts, before);
    assert.equal(await prisma.dteSubmission.count({ where: { saleId: row.id } }), 0);
  });
  await check('weight quantities and line discounts survive the documented payload conversion', async () => {
    const row = await sale({ total: 166.6, items: { create: { productId: product.id, quantity: 1.5, price: 119, discountAmount: 11.9 } } });
    await lioren.emitirBoleta(row.id); const payload = payloads.at(-1); assert.equal(payload.detalles[0].cantidad, 1.5); assert.equal(payload.detalles[0].descuento, 11.9); assert.equal(payload.emisor.servicio, 3); assert.equal(payload.pago, undefined);
    const invoice = await sale({ dteType: 33 }); await lioren.emitirFactura(invoice.id); assert.equal(payloads.at(-1).detalles[0].precio, 100); assert.equal(payloads.at(-1).receptor.ciudad, 2);
  });
  await check('lost or malformed responses remain uncertain and are never automatically resent', async () => {
    for (const value of ['network', 'malformed']) { mode = value; const row = await sale(); const before = posts; assert.equal((await lioren.emitirBoleta(row.id)).status, 'PENDIENTE_CONFIRMACION'); await lioren.emitirBoleta(row.id); assert.equal(posts - before, 1); await assert.rejects(sales.cancelInternalSale(row.id, tenant.id, 'fixture-actor'), /conciliación/); }
    mode = 'normal';
  });
  await check('historical accepted mocks and errors remain unchanged and are not sent again', async () => {
    const row = await sale({ dteStatus: 'ACEPTADO', dteFolio: 80000, dtePdfUrl: 'https://lioren.cl/ver/boleta/ejemplo-mock' }); const before = posts;
    assert.equal((await lioren.emitirBoleta(row.id)).success, false); assert.equal(posts, before); assert.equal((await prisma.sale.findUnique({ where: { id: row.id } })).dteStatus, 'ACEPTADO');
    const error = await sale({ dteStatus: 'ERROR' }); await lioren.emitirBoleta(error.id); assert.equal(posts, before);
  });
  await check('credit note preflight is read-only and missing folios never create a blocked note', async () => {
    mode = 'normal'; accepted = true; const original = await sale(); await lioren.emitirBoleta(original.id);
    const before = posts; const beforeSales = await prisma.sale.count({ where: { tenantId: tenant.id } });
    const valid = await sales.creditNotePreview(original.id, tenant.id); assert.equal(valid.canEmit, true);
    assert.equal(posts, before); assert.equal(await prisma.sale.count({ where: { tenantId: tenant.id } }), beforeSales);
    notesEnabled = false;
    const blocked = await sales.creditNotePreview(original.id, tenant.id); assert.equal(blocked.canEmit, false); assert.match(blocked.message, /folios/);
    await assert.rejects(sales.emitirNotaCreditoForSale(original.id, tenant.id), /folios/);
    assert.equal(await prisma.sale.count({ where: { originalSaleId: original.id } }), 0); assert.equal(posts, before); notesEnabled = true;
    const anonymous = await sale({ customerId: null }); await lioren.emitirBoleta(anonymous.id);
    const anonymousPreview = await sales.creditNotePreview(anonymous.id, tenant.id); assert.equal(anonymousPreview.canEmit, false); assert.match(anonymousPreview.message, /receptor/);
    await assert.rejects(sales.emitirNotaCreditoForSale(anonymous.id, tenant.id), /receptor/);
    assert.equal(await prisma.sale.count({ where: { originalSaleId: anonymous.id } }), 0);
    const guide = await sale({ dteType: 52 }); await lioren.emitirGuiaDespacho(guide.id);
    await assert.rejects(sales.emitirNotaCreditoForSale(guide.id, tenant.id), /boleta o factura/);
  });
  await check('credit note failure never cancels the original or returns inventory', async () => {
    accepted = true; const original = await sale({ payments: { create: { amount: 238, paymentMethod: 'EFECTIVO' } } }); await lioren.emitirBoleta(original.id); mode = 'network'; const before = posts;
    const response = await sales.emitirNotaCreditoForSale(original.id, tenant.id); assert.equal(response.success, false); assert.equal((await prisma.sale.findUnique({ where: { id: original.id } })).status, 'COMPLETED');
    assert.equal(await currentInventory(), 8);
    await sales.emitirNotaCreditoForSale(original.id, tenant.id); assert.equal(posts - before, 1); mode = 'normal';
  });
  await check('credit note inventory and cancellation apply once after SII acceptance', async () => {
    accepted = true; const original = await sale({ payments: { create: { amount: 238, paymentMethod: 'EFECTIVO' } } }); await lioren.emitirBoleta(original.id); accepted = false;
    const postsBefore = posts; await Promise.all([sales.emitirNotaCreditoForSale(original.id, tenant.id), sales.emitirNotaCreditoForSale(original.id, tenant.id)]); assert.equal(posts - postsBefore, 1); assert.equal(await prisma.sale.count({ where: { originalSaleId: original.id } }), 1); const note = await prisma.sale.findFirst({ where: { originalSaleId: original.id } });
    assert.equal((await prisma.sale.findUnique({ where: { id: original.id } })).status, 'COMPLETED'); assert.equal(await prisma.payment.count({ where: { saleId: note.id } }), 0);
    accepted = true; await sales.verifyDte(note.id, tenant.id); await sales.verifyDte(note.id, tenant.id);
    assert.equal((await prisma.sale.findUnique({ where: { id: original.id } })).status, 'CANCELLED');
    assert.equal(await currentInventory(), 10);
    assert.equal(await prisma.stockMovement.count({ where: { branchId: branch.id, type: 'RETURN' } }), 1);
    assert.equal((await prisma.sale.findUnique({ where: { id: note.id } })).status, 'CREDIT_NOTE');
  });
  const request = async (method, path, jwt, data) => { const r = await fetch('http://release-api:3000/api' + path, { method, headers: { Authorization: 'Bearer ' + jwt, ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined }); const text = await r.text(); return { status: r.status, data: text ? JSON.parse(text) : null }; };
  await check('credit note preview and emission reject foreign tenants and unauthorized roles over HTTP', async () => {
    const row = await sale();
    assert.equal((await request('GET', '/sales/' + row.id + '/dte/pdf', '')).status, 401);
    assert.equal((await request('GET', '/sales/' + row.id + '/dte/pdf', context.customerToken)).status, 404);
    assert.equal((await request('GET', '/sales/' + row.id + '/dte/print-data', '')).status, 401);
    assert.equal((await request('GET', '/sales/' + row.id + '/dte/print-data', context.customerToken)).status, 404);
    for (const method of ['GET', 'POST']) {
      assert.equal((await request(method, '/sales/' + row.id + '/nota-credito', context.customerToken)).status, method === 'GET' ? 404 : 403);
      assert.equal((await request(method, '/sales/' + row.id + '/nota-credito', '')).status, 401);
    }
    const ownWithoutModule = await prisma.sale.create({ data: { tenantId: context.customerId, branchId: context.customerUser.branchId, total: 119, status: 'COMPLETED' } });
    const preview = await request('GET', '/sales/' + ownWithoutModule.id + '/nota-credito', context.customerToken);
    assert.equal(preview.status, 200); assert.equal(preview.data.canEmit, false);
    assert.equal((await request('POST', '/sales/' + ownWithoutModule.id + '/nota-credito', context.customerToken)).status, 403);
    await prisma.sale.delete({ where: { id: ownWithoutModule.id } });
    const bcrypt = require('bcrypt'); const password = 'Fixture-password-1842';
    const worker = await prisma.user.create({ data: { tenantId: tenant.id, branchId: branch.id, role: 'CASHIER', email: randomUUID() + '@example.invalid', password: await bcrypt.hash(password, 4) } });
    const login = await request('POST', '/auth/login', '', { email: worker.email, password }); assert.equal(login.status, 200);
    for (const method of ['GET', 'POST']) assert.equal((await request(method, '/sales/' + row.id + '/nota-credito', login.data.access_token)).status, 403);
    assert.equal(await prisma.sale.count({ where: { originalSaleId: row.id } }), 0);
  });
  await check('saved token and foreign configuration are protected through the real HTTP API', async () => {
    const config = await request('GET', '/dte-config', context.customerToken); assert.equal(config.status, 200);
    const { JwtService } = require('@nestjs/jwt');
    const owner = await prisma.user.create({ data: { tenantId: tenant.id, branchId: branch.id, email: randomUUID() + '@example.invalid', role: 'TENANT_ADMIN' } });
    const ownerJwt = new JwtService({ secret: 'isolated-ci-check-secret' }).sign({ sub: owner.id, tenantId: tenant.id, role: 'TENANT_ADMIN', tokenVersion: 0 });
    const ownConfig = await request('GET', '/dte-config', ownerJwt); assert.equal(ownConfig.status, 200); assert.equal(ownConfig.data.hasToken, true); assert(!JSON.stringify(ownConfig.data).includes(token));
    await prisma.user.update({ where: { id: owner.id }, data: { role: 'CASHIER' } });
    assert.equal((await request('GET', '/dte-config', ownerJwt)).status, 403);
    assert.equal((await request('POST', '/dte-config', ownerJwt, { liorenLogo: 'forbidden' })).status, 403);
    const target = await prisma.dteConfig.findUnique({ where: { tenantId: tenant.id } });
    const patch = await request('PATCH', '/dte-config/' + target.id, context.customerToken, { liorenLogo: 'invalid-foreign-change' }); assert.equal(patch.status, 404); assert.equal((await prisma.dteConfig.findUnique({ where: { id: target.id } })).liorenLogo, null);
    const stats = await request('GET', '/dte-config/stats', context.customerToken); assert.equal(stats.status, 200); assert.equal(stats.data.provider.total, null); assert(stats.data.connection.types.every(type => type.available === null));
  });
  await check('disconnect is tenant-scoped, rejects cashiers, retains history and permits internal sales without provider requests', async () => {
    const { JwtService } = require('@nestjs/jwt');
    const owner = await prisma.user.create({ data: { tenantId: tenant.id, branchId: branch.id, email: randomUUID() + '@example.invalid', role: 'TENANT_ADMIN' } });
    const jwt = new JwtService({ secret: 'isolated-ci-check-secret' }).sign({ sub: owner.id, tenantId: tenant.id, role: 'TENANT_ADMIN', tokenVersion: 0 });
    const beforeSales = await prisma.sale.count({ where: { tenantId: tenant.id } });
    const beforeSubmissions = await prisma.dteSubmission.count({ where: { tenantId: tenant.id } });
    const otherConfig = await prisma.dteConfig.findUnique({ where: { tenantId: context.customerId } });
    assert.equal((await request('DELETE', '/dte-config/token', '')).status, 401);
    await prisma.user.update({ where: { id: owner.id }, data: { role: 'CASHIER' } });
    assert.equal((await request('DELETE', '/dte-config/token', jwt)).status, 403);
    const cashierMode = await request('GET', '/dte-config/sales-mode', jwt); assert.equal(cashierMode.status, 200); assert.deepEqual(cashierMode.data, { mode: 'fiscal' });
    await prisma.user.update({ where: { id: owner.id }, data: { role: 'TENANT_ADMIN' } });
    const removed = await request('DELETE', '/dte-config/token', jwt);
    assert.equal(removed.status, 200); assert.equal(removed.data.hasToken, false); assert(!JSON.stringify(removed.data).includes(token));
    const saved = await prisma.dteConfig.findUnique({ where: { tenantId: tenant.id } });
    assert.equal(saved.liorenToken, null); assert.equal(saved.dteResolution, '80');
    assert.equal((await request('DELETE', '/dte-config/token', jwt)).status, 200);
    assert.equal((await request('GET', '/dte-config/sales-mode', jwt)).data.mode, 'internal');
    assert.equal(await prisma.sale.count({ where: { tenantId: tenant.id } }), beforeSales);
    assert.equal(await prisma.dteSubmission.count({ where: { tenantId: tenant.id } }), beforeSubmissions);
    assert.deepEqual(await prisma.dteConfig.findUnique({ where: { tenantId: context.customerId } }), otherConfig);
    await prisma.cashShift.create({ data: { branchId: branch.id, openedById: owner.id, status: 'OPEN', initialAmount: 0 } });
    const dto = { tenantId: tenant.id, branchId: branch.id, userId: owner.id, items: [{ productId: product.id, quantity: 1, price: 119 }], payments: [{ paymentMethod: 'EFECTIVO', amount: 119 }], dteType: 39 };
    const beforeStock = await currentInventory(); const beforePosts = posts;
    const { InternalReceiptService } = require('../dist/dte/internal-receipt.service');
    const receipts = new InternalReceiptService(prisma);
    const internalSales = new SalesService(prisma, dte, receipts, {}, inventory, { emit: () => {} }, {});
    const internal = await internalSales.createSale(dto);
    assert.equal(internal.dteType, 0); assert.equal(internal.dteStatus, 'INTERNO'); assert.equal(internal.dteFolio, null); assert.match(internal.internalReceiptUrl || '', /^\/api\/receipts\//);
    await fs.writeFile('/checks-results/sale-pdf-fixture.pdf', await fs.readFile(receipts.getReceiptPath(internal.id)));
    assert.equal(await currentInventory(), beforeStock - 1); assert.equal(posts, beforePosts);
    assert.equal(await prisma.dteSubmission.count({ where: { saleId: internal.id } }), 0);
    const configs = new DteConfigService(prisma, account, api);
    await configs.upsert({ tenantId: tenant.id, liorenToken: token });
    await dte.emitirDte(internal.id); assert.equal(posts, beforePosts);
    await configs.disconnect(tenant.id, owner.id);
    await assert.rejects(() => internalSales.createSale({ ...dto, dteType: 33 }), /desconectada/);
    assert.equal(await currentInventory(), beforeStock - 1);
    await internalSales.cancelInternalSale(internal.id, tenant.id, owner.id);
    assert.equal(await currentInventory(), beforeStock);
    assert.equal((await prisma.sale.findUnique({ where: { id: internal.id } })).status, 'CANCELLED');
    assert.equal(posts, beforePosts);
  });
  await check('new submission records are removed by complete account deletion without affecting other clients', async () => {
    const preview = await request('GET', '/admin/tenants/' + tenant.id + '/deletion-preview', context.rootToken);
    const removed = await request('DELETE', '/admin/tenants/' + tenant.id, context.rootToken, { confirmation: preview.data.confirmation, password: 'Fixture-password-1842' });
    assert.equal(removed.status, 200, JSON.stringify(removed.data)); assert.equal(await prisma.dteSubmission.count({ where: { tenantId: tenant.id } }), 0);
    assert(await prisma.tenant.findUnique({ where: { id: context.customerId } }));
  });
  console.log('LIOREN_INTEGRITY_CHECKS=' + checks);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
