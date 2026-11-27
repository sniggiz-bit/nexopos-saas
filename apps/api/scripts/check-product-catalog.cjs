const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const database = new URL(process.env.DATABASE_URL);
assert.equal(process.env.NEXOPOS_CATALOG_CHECK, '1');
assert.equal(database.hostname, 'release-db');
assert.equal(database.pathname, '/release_check');

const { PrismaClient } = require('@prisma/client');
const { ProductsService } = require('../dist/products/products.service');
const { ProductsController } = require('../dist/products/products.controller');
const prisma = new PrismaClient();
const controller = new ProductsController(new ProductsService(prisma), {});

async function checkCatalog() {
  const tenant = await prisma.tenant.create({ data: { slug: 'catalog-check-' + randomUUID(), name: 'Catálogo de prueba' } });
  const branch = await prisma.branch.create({ data: { name: 'Casa Matriz', tenantId: tenant.id, isActive: true } });
  const user = { tenantId: tenant.id, branchId: branch.id };
  await prisma.product.createMany({
    data: Array.from({ length: 205 }, (_, index) => ({
      tenantId: tenant.id,
      name: 'A producto ' + String(index).padStart(3, '0'),
      sku: 'ITEM-' + index,
      price: 1000,
    })),
  });
  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: 'Cartulina morada',
      sku: 'CART-001',
      barcode: '0000012345',
      price: 2200,
      inventory: { create: { branchId: branch.id, quantity: 7.125 } },
    },
  });

  const firstPage = await controller.findAll(user, undefined, undefined, undefined, '1', '200');
  assert.equal(firstPage.total, 206);
  assert.ok(firstPage.data.every(item => item.id !== product.id));
  for (const search of ['cartulina', product.sku, product.barcode]) {
    const matches = await controller.findAll(user, search, undefined, undefined, '1', '50');
    assert.deepEqual(matches.data.map(item => item.id), [product.id]);
    assert.equal(matches.data[0].stock, 7.125);
  }

  const rows = [
    { rowNumber: 2, sku: product.sku.toLowerCase(), name: 'Valor anterior del Excel', price: 1800, stock: 19 },
    { rowNumber: 3, sku: 'CART-002', name: 'Cartulina naranja', barcode: product.barcode, price: 2300, stock: 5 },
    { rowNumber: 4, sku: 'CART-003' },
  ];
  const counts = ({ created, updated, skipped, errors }) => ({ created, updated, skipped, errors });
  const initial = await controller.importProducts({ rows }, user);
  assert.deepEqual(counts(initial), { created: 1, updated: 0, skipped: 2, errors: 0 });
  const added = await prisma.product.findFirstOrThrow({ where: { tenantId: tenant.id, sku: 'CART-002' } });
  assert.equal(added.barcode, null);

  const movements = () => prisma.stockMovement.count({ where: { branchId: branch.id } });
  const beforeReplay = await movements();
  const replay = await controller.importProducts({ rows, onlyNew: true }, user);
  assert.deepEqual(counts(replay), { created: 0, updated: 0, skipped: 3, errors: 0 });
  assert.equal(await movements(), beforeReplay);
  const preserved = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { inventory: true } });
  assert.equal(preserved.name, product.name);
  assert.equal(preserved.price, product.price);
  assert.equal(Number(preserved.inventory[0].quantity), 7.125);

  const concurrent = [{ rowNumber: 5, sku: 'CART-CONCURRENT', name: 'Cartulina de prueba simultánea', stock: 4 }];
  const overlap = await Promise.all([
    controller.importProducts({ rows: concurrent }, user),
    controller.importProducts({ rows: concurrent }, user),
  ]);
  assert.equal(overlap.reduce((sum, result) => sum + result.created, 0), 1, JSON.stringify(overlap));
  assert.equal(overlap.reduce((sum, result) => sum + result.skipped, 0), 1, JSON.stringify(overlap));
  assert.equal(await prisma.product.count({ where: { tenantId: tenant.id, sku: 'CART-CONCURRENT' } }), 1);
  console.log('PASS: global catalogue lookup, safe Excel replay, shared barcodes and concurrent import in PostgreSQL');
}

checkCatalog().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
