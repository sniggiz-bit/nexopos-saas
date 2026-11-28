const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const db = new URL(process.env.DATABASE_URL || 'http://invalid');
const disposable = db.hostname === 'nexopos-offline-db' && db.pathname === '/nexopos_offline_check' ||
  db.hostname === 'release-db' && db.pathname === '/release_check';
if (process.env.NEXOPOS_OFFLINE_CHECK !== '1' || !disposable) throw Error('Disposable offline POS database required.');

const { PrismaClient } = require('@prisma/client');
const { SalesService } = require('../dist/sales/sales.service');
const { InventoryService } = require('../dist/inventory/inventory.service');
const { ShiftsService } = require('../dist/shifts/shifts.service');
const prisma = new PrismaClient();

(async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Offline POS test', slug: randomUUID() } });
    const branch = await prisma.branch.create({ data: { tenantId: tenant.id, name: 'Test branch', isActive: true } });
    const operator = await prisma.user.create({ data: { email: randomUUID() + '@example.invalid', tenantId: tenant.id, branchId: branch.id } });
    const shift = await prisma.cashShift.create({ data: { branchId: branch.id, openedById: operator.id, initialAmount: 0 } });
    const product = await prisma.product.create({ data: { tenantId: tenant.id, name: 'Fixture product', price: 800 } });
    await prisma.inventory.create({ data: { productId: product.id, branchId: branch.id, quantity: 10 } });

    const emissions = [];
    const receipts = [];
    const events = [];
    const sales = new SalesService(prisma, { emitirDte: id => emissions.push(id) },
        { generateReceipt: id => receipts.push(id) }, {}, new InventoryService(prisma),
        { emit: event => events.push(event) }, {});
    const makeSale = (overrides = {}) => ({
        tenantId: tenant.id, branchId: branch.id, userId: operator.id, dteType: 0,
        items: [{ productId: product.id, quantity: 2, price: 800 }],
        payments: [{ paymentMethod: 'EFECTIVO', amount: 1600 }],
        offline: { id: randomUUID(), operatorId: operator.id, shiftId: shift.id, recordedAt: new Date().toISOString(), ...overrides },
    });
    const stock = async () => Number((await prisma.inventory.findFirst({ where: { productId: product.id, branchId: branch.id } })).quantity);

    const cashSale = makeSale();
    const [saved, duplicate] = await Promise.all([sales.createSale(cashSale), sales.createSale(cashSale)]);
    assert.equal(saved.id, duplicate.id);
    assert.equal(saved.offlineId, cashSale.offline.id);
    assert.equal(saved.cashShiftId, shift.id);
    assert.equal(saved.createdAt.toISOString(), cashSale.offline.recordedAt);
    assert.equal(saved.payments[0].createdAt.toISOString(), cashSale.offline.recordedAt);
    assert.equal(await stock(), 8);
    assert.equal(await prisma.stockMovement.count({ where: { productId: product.id, type: 'SALE' } }), 1);
    assert.equal(emissions.length, 1);
    assert.equal(receipts.length, 1);
    assert.equal(events.length, 1);
    console.log('PASS: simultaneous replays deduct one sale and emit one set of effects');

    const wrongOperator = makeSale({ operatorId: randomUUID() });
    await assert.rejects(sales.createSale(wrongOperator), { status: 400 });
    await prisma.dteConfig.create({ data: { tenantId: tenant.id, liorenToken: 'fixture-never-sent' } });
    await assert.rejects(sales.createSale(makeSale()), { status: 400 });
    const debit = makeSale({ receiptReference: 'BOLETA CONTINGENCIA 84' });
    debit.payments[0].paymentMethod = 'DEBITO';
    await assert.rejects(sales.createSale(debit), { status: 400 });
    debit.offline.paymentReference = 'TERMINAL 10012';
    const fiscal = await sales.createSale(debit);
    assert.equal(fiscal.offlineReceipt, debit.offline.receiptReference);
    assert.equal(fiscal.offlinePayment, debit.offline.paymentReference);
    assert.equal(fiscal.dteStatus, 'CONTINGENCIA');
    assert.equal(emissions.length, 1);
    assert.equal(receipts.length, 1);
    await assert.rejects(sales.cancelInternalSale(fiscal.id, tenant.id, operator.id), { status: 400 });
    assert.equal(await stock(), 6);
    console.log('PASS: fiscal references and confirmed external payments persist without reissuing the document');

    const wrongTotal = makeSale({ receiptReference: 'BOLETA CONTINGENCIA 85' });
    wrongTotal.payments[0].amount = 5000;
    await assert.rejects(sales.createSale(wrongTotal), { status: 400 });
    assert.equal(await stock(), 6);
    await prisma.cashShift.update({ where: { id: shift.id }, data: { status: 'CLOSED', endTime: new Date() } });
    const nextShift = await prisma.cashShift.create({ data: { branchId: branch.id, openedById: operator.id, initialAmount: 0 } });
    await assert.rejects(sales.createSale(makeSale({ receiptReference: 'BOLETA CONTINGENCIA 85' })), { status: 409 });
    assert.equal((await sales.createSale(cashSale)).id, saved.id);
    assert.equal(await stock(), 6);
    assert.equal(await prisma.sale.count({ where: { tenantId: tenant.id } }), 2);
    console.log('PASS: invalid payments roll back and a closed shift never redirects a pending sale');

    const inventory = new InventoryService(prisma);
    let writing;
    let commit;
    const canCommit = new Promise(resolve => { commit = resolve; });
    const waiting = new Promise(resolve => { writing = resolve; });
    const racingSales = new SalesService(prisma, {}, {}, {}, {
        async logMovement(...args) {
            await inventory.logMovement(...args);
            writing();
            await canCommit;
        },
    }, { emit() {} }, {});
    const shifts = new ShiftsService(prisma, { generateTextReport: () => 'report' });
    const saleDuringClose = racingSales.createSale(makeSale({ shiftId: nextShift.id, receiptReference: 'BOLETA CONTINGENCIA 86' }));
    await Promise.race([waiting, saleDuringClose]);
    const closing = shifts.closeShift(nextShift.id, operator.id, 1600);
    commit();
    await saleDuringClose;
    const closed = await closing;
    assert.equal(closed.shift.metadata.totalSales, 1600);
    assert.equal(closed.shift.metadata.difference, 0);
    assert.equal(await stock(), 4);
    console.log('PASS: closing cash waits for the offline sale and includes its payment');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
