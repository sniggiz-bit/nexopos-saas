const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('/tmp/ui-check/node_modules/playwright');
const origin = 'http://release-web';
(async () => {
    const fixture = JSON.parse(await fs.readFile('/checks-results/context.json', 'utf8'));
    const browser = await chromium.launch({ headless: true, args: ['--unsafely-treat-insecure-origin-as-secure=http://release-web'] });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Santiago' });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin);
        await page.evaluate(({ token, user }) => { localStorage.clear(); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }, { token: fixture.customerToken, user: fixture.customerUser });
        const originalId = '10000000-0000-4000-8000-000000000001'; const legacyId = '10000000-0000-4000-8000-000000000002'; const noteId = '10000000-0000-4000-8000-000000000003';
        const createdAt = new Date().toISOString(); let emitted = false; let accepted = false; let noFolios = false; let posts = 0; let verifications = 0;
        const original = () => ({ id: originalId, tenantId: fixture.customerId, branchId: fixture.customerUser.branchId, total: 11900, status: accepted ? 'CANCELLED' : 'COMPLETED', dteType: 39, dteFolio: 1001, dteStatus: 'ACEPTADO', dteProviderId: 'fictional-provider', dteVerifiedAt: createdAt, createdAt, updatedAt: createdAt, branch: { name: 'Sucursal ficticia' } });
        const legacy = () => ({ ...original(), id: legacyId, dteFolio: null, dteProviderId: null, dteVerifiedAt: null, dteStatus: 'PENDING', status: 'COMPLETED' });
        const records = () => [original(), legacy(), ...(emitted ? [{ ...original(), id: noteId, originalSaleId: originalId, dteType: 61, dteFolio: 2001, status: accepted ? 'CREDIT_NOTE' : 'PENDING_CREDIT_NOTE', dteStatus: accepted ? 'ACEPTADO' : 'PENDIENTE_SII' }] : [])];
        await page.route(/\/api\/sales(?:\/|\?|$)/, async route => {
            const request = route.request(); const url = new URL(request.url()); let body;
            if (url.pathname === '/api/sales') { assert.equal(request.method(), 'GET'); body = records(); }
            else if (url.pathname.endsWith('/dte/verify')) { assert.equal(request.method(), 'POST'); assert(url.pathname.includes(noteId)); accepted = true; verifications++; body = { success: true, status: 'ACEPTADO' }; }
            else if (url.pathname.endsWith('/nota-credito')) {
                if (request.method() === 'POST') { assert(url.pathname.includes(originalId)); assert(!noFolios && !emitted); posts++; emitted = true; body = { success: true, noteId, folio: 2001, status: 'PENDIENTE_SII' }; }
                else {
                    assert.equal(request.method(), 'GET'); const isLegacy = url.pathname.includes(legacyId); const row = isLegacy ? legacy() : original();
                    body = { sale: { id: row.id, type: 39, folio: row.dteFolio, total: row.total, createdAt, branchName: row.branch.name }, canEmit: !isLegacy && !noFolios && !emitted, existingNote: emitted && !isLegacy ? { id: noteId, folio: 2001, status: accepted ? 'CREDIT_NOTE' : 'PENDING_CREDIT_NOTE', dteStatus: accepted ? 'ACEPTADO' : 'PENDIENTE_SII', canVerify: !accepted } : null, message: isLegacy ? 'La venta debe tener una boleta o factura confirmada en Lioren.' : emitted ? accepted ? 'La nota de crédito ya fue aceptada y la venta está anulada.' : 'Ya existe una nota de crédito asociada. Revisa su estado; no se creará otro documento.' : noFolios ? 'Este documento no tiene servicio habilitado o folios disponibles.' : 'Se emitirá una nota de crédito por el total del documento original.' };
                }
            } else throw Error('Unexpected sales operation: ' + request.method() + ' ' + url.pathname);
            await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
        });
        await page.goto(origin + '/dashboard/sales');
        await page.getByRole('heading', { name: 'Historial de Ventas', exact: true }).waitFor();
        const actions = () => page.getByRole('button', { name: 'Nota de crédito', exact: true });
        await actions().nth(1).click(); let dialog = page.getByRole('dialog');
        await dialog.getByText('La venta debe tener una boleta o factura confirmada en Lioren.').waitFor();
        assert.equal(await dialog.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).count(), 0); assert.equal(posts, 0);
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        noFolios = true; await actions().first().click(); dialog = page.getByRole('dialog');
        await dialog.getByText('Este documento no tiene servicio habilitado o folios disponibles.').waitFor();
        assert.equal(await dialog.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).count(), 0);
        await page.screenshot({ path: '/checks-results/credit-note-no-folios.png', fullPage: true });
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click(); noFolios = false;
        console.log('PASS: visible credit note action explains unverified originals and missing folios without any emission POST');
        await actions().first().click(); dialog = page.getByRole('dialog');
        await dialog.getByRole('checkbox').waitFor(); assert(await dialog.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).isDisabled());
        await page.screenshot({ path: '/checks-results/credit-note-confirmation-desktop.png', fullPage: true });
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click(); assert.equal(posts, 0);
        await dialog.waitFor({ state: 'hidden' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('main').parentElement).paddingLeft === '0px');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Sales page overflows mobile width');
        await page.screenshot({ path: '/checks-results/sales-credit-note-actions-mobile.png', fullPage: true });
        await actions().first().click(); dialog = page.getByRole('dialog'); await dialog.getByRole('checkbox').waitFor();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Credit note dialog overflows mobile width');
        await page.screenshot({ path: '/checks-results/credit-note-confirmation-mobile.png', fullPage: true });
        assert.equal(posts, 0); await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).click();
        await dialog.getByRole('heading', { name: 'Nota de crédito asociada', exact: true }).waitFor();
        await dialog.getByText(/Folio 2001 · Pendiente SII/).waitFor(); assert.equal(posts, 1); assert.equal(accepted, false);
        assert.equal(await dialog.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).count(), 0);
        console.log('PASS: cancellation makes no request and emission requires explicit confirmation on desktop and mobile');
        await dialog.getByRole('button', { name: 'Consultar estado en Lioren', exact: true }).click();
        await dialog.getByText('Folio 2001 · Aceptada y aplicada', { exact: true }).waitFor(); assert.equal(verifications, 1); assert.equal(posts, 1);
        await page.screenshot({ path: '/checks-results/credit-note-accepted.png', fullPage: true });
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await page.getByRole('button', { name: 'Ver nota de crédito', exact: true }).click(); dialog = page.getByRole('dialog');
        await dialog.getByText('Folio 2001 · Aceptada y aplicada', { exact: true }).waitFor(); assert.equal(posts, 1);
        assert.equal(await dialog.getByRole('button', { name: 'Emitir nota de crédito', exact: true }).count(), 0);
        assert.deepEqual(errors, []);
        console.log('PASS: an existing note can be consulted from sales and cannot be emitted again');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
