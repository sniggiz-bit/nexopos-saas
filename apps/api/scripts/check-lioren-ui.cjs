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
    let disconnected = false; let disconnects = 0; let synced = false; let partial = false; let showReview = false; let needsSupport = 0; const updates = [];
    const config = () => ({ id: 'fictional-config', tenantId: fixture.customerId, hasToken: !disconnected, liorenLogo: null, dteResolution: synced ? '80' : '53', resolutionDate: synced ? '2020-01-01T00:00:00Z' : '2025-04-29T00:00:00Z' });
    const stats = () => ({
      connection: {
        registeredRut: synced ? '76.000.000-0' : '11.111.111-1', configured: true, connected: true,
        state: partial ? 'partial' : synced ? 'ready' : 'identity_mismatch', message: partial ? 'Consulta de folios no disponible.' : synced ? 'Empresa y resolución verificadas.' : 'El RUT registrado no coincide con la empresa del token.',
        checkedAt: '2026-11-18T12:00:00Z', identityMatches: synced, resolutionMatches: synced, certificateValid: true,
        company: { name: 'Empresa ficticia para revisión visual', rut: '76.000.000-0', resolution: '80', resolutionDate: '2020-01-01', validFrom: '2020-01-01', validTo: '2099-01-01' },
        types: [39, 33, 61, 52].map((type, index) => ({ type, label: ['Boleta electrónica', 'Factura electrónica', 'Nota de crédito', 'Guía de despacho'][index], providerActive: partial ? null : true, available: partial ? null : type === 39 ? 1031 : 0, nextFolio: partial || type !== 39 ? null : 16608, localEnabled: true, ready: synced && !partial && type === 39 })),
      },
      provider: { source: 'lioren', month: '2026-11', checkedAt: '2026-11-18T12:00:00Z', total: partial ? null : 130, accepted: partial ? null : 125, rejected: partial ? null : 3, partial, types: [{ type: 39, label: 'Boleta electrónica', total: partial ? null : 130, accepted: partial ? null : 125, rejected: partial ? null : 3, message: partial ? 'Consulta incompleta' : '' }], recent: [{ type: 39, label: 'Boleta electrónica', folio: 16607, date: '2026-11-18', total: 2500, state: 'acepta' }] },
      local: { confirmed: 0, unverified: 7, errors: 60, pending: showReview ? 1 : 0, needsSupport, reviewDocs: showReview ? [{ id: '00000000-0000-4000-8000-000000000001', dteType: 39, dteFolio: 16608, dteStatus: 'PENDIENTE_SII' }] : [] },
    });
    await page.route(/\/api\/dte-config(?:\/|\?|$)/, async route => {
      const request = route.request(); const url = new URL(request.url()); let body;
      if (url.pathname.endsWith('/sync-issuer')) { assert.equal(request.method(), 'POST'); assert.deepEqual(request.postDataJSON(), { expectedRut: '76.000.000-0' }); synced = true; body = stats().connection; }
      else if (url.pathname.endsWith('/token')) { assert.equal(request.method(), 'DELETE'); disconnected = true; disconnects++; body = config(); }
      else if (url.pathname.endsWith('/stats')) { body = stats(); if (disconnected) body.connection = { ...body.connection, configured: false, connected: false, state: 'not_configured', company: null, message: 'Control de ventas interno activo.' }; }
      else if (request.method() === 'POST') { updates.push(request.postDataJSON()); body = config(); }
      else body = config();
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto(origin + '/dashboard/settings');
    await page.getByRole('heading', { name: 'Conexión con Lioren', exact: true }).waitFor();
    const credential = page.getByLabel('Reemplazar token de Lioren', { exact: true }); await credential.waitFor(); assert.equal(await credential.inputValue(), '');
    await page.getByText('El RUT registrado no coincide con la empresa del token.', { exact: true }).waitFor();
    await page.getByRole('row', { name: /Boleta electrónica/ }).getByText('16.608', { exact: true }).waitFor();
    assert.equal(await page.getByRole('row', { name: /Factura electrónica/ }).locator('td').nth(3).innerText(), '0');
    await page.screenshot({ path: '/checks-results/lioren-validation-desktop.png', fullPage: true });
    assert.equal(await page.getByRole('heading', { name: 'Control de registros de NexoPOS' }).count(), 0);
    assert.equal(await page.getByText(/Hay registros históricos/).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Revisar ventas' }).count(), 0);
    console.log('PASS: customer sees actual provider metrics without historical diagnostic counters or legacy error alerts');
    await page.getByRole('button', { name: 'Usar empresa del token', exact: true }).click();
    const dialog = page.getByRole('dialog');
    assert(await dialog.getByRole('button', { name: 'Sincronizar empresa emisora', exact: true }).isDisabled());
    await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Sincronizar empresa emisora', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' }); await page.getByText('Datos verificados', { exact: true }).waitFor();
    const unchangedResponse = page.waitForResponse(response => response.url().endsWith('/api/dte-config') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
    await unchangedResponse;
    assert(updates.length >= 1); assert.equal(updates[0].liorenToken, undefined);
    await credential.fill('fixture-replacement-never-real');
    const saved = page.waitForResponse(response => response.url().endsWith('/api/dte-config') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click(); await saved;
    await page.waitForFunction(() => document.querySelector('input[type="password"]')?.value === '');
    assert.equal(updates.at(-1).liorenToken, 'fixture-replacement-never-real');
    console.log('PASS: issuer synchronization requires explicit confirmation and a saved token is not sent again from an empty field');
    showReview = true; needsSupport = 1;
    await page.route('**/api/sales/00000000-0000-4000-8000-000000000001/dte/verify', async route => {
      assert.equal(route.request().method(), 'POST'); showReview = false; needsSupport = 0;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ACEPTADO' }) });
    });
    await page.getByRole('button', { name: 'Actualizar datos', exact: true }).click();
    await page.getByRole('heading', { name: 'Documentos pendientes de confirmación' }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Revisar ventas' }).getAttribute('href'), '/dashboard/sales');
    await page.getByRole('button', { name: 'Consultar estado en Lioren' }).click();
    await page.getByRole('heading', { name: 'Documentos pendientes de confirmación' }).waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('link', { name: 'Revisar ventas' }).count(), 0);
    console.log('PASS: current incidents show an actionable notice and pending documents retain read-only provider verification');
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(origin + '/dashboard/settings');
    await page.getByText('Datos verificados', { exact: true }).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Lioren screen overflows mobile width');
    await page.screenshot({ path: '/checks-results/lioren-validation-mobile.png', fullPage: true });
    partial = true; await page.getByRole('button', { name: 'Actualizar datos', exact: true }).click();
    await page.getByText('Consulta de folios no disponible.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('row', { name: /Factura electrónica/ }).locator('td').nth(3).innerText(), '—');
    await page.screenshot({ path: '/checks-results/lioren-unavailable-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Desconectar Lioren', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(disconnects, 0);
    await page.getByRole('button', { name: 'Desconectar Lioren', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Quitar token y usar ventas internas', exact: true }).click();
    await page.getByText('Control de ventas interno', { exact: true }).waitFor();
    await page.getByLabel('Token de Lioren', { exact: true }).waitFor();
    assert.equal(disconnects, 1);
    assert.equal(await page.getByRole('heading', { name: 'Actividad confirmada por Lioren' }).count(), 0);
    assert.equal(await page.getByText(/^Empresa ficticia para revisi/).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Desconectar Lioren', exact: true }).count(), 0);
    await page.screenshot({ path: '/checks-results/lioren-disconnected-mobile.png', fullPage: true });
    console.log('PASS: cancellation preserves token; explicit disconnection clears provider details and enables internal mode');
    partial = false;
    await page.evaluate(({ token, user }) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }, { token: fixture.rootToken, user: fixture.rootUser });
    let diagnosticsFailed = false;
    await page.route('**/api/admin/tenants/' + fixture.customerId + '/dte-records', async route => {
      assert.equal(route.request().method(), 'GET');
      await route.fulfill({ status: diagnosticsFailed ? 503 : 200, contentType: 'application/json', body: JSON.stringify(diagnosticsFailed ? { message: 'Diagnóstico temporalmente no disponible.' } : stats().local) });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/admin/tenants/' + fixture.customerId + '?tab=dte');
    await page.getByRole('heading', { name: 'Control de registros de NexoPOS', exact: true }).waitFor();
    assert.equal(await page.getByRole('tab', { name: 'Registros tributarios', exact: true }).getAttribute('aria-selected'), 'true');
    await page.getByText('60', { exact: true }).waitFor(); await page.getByText('7', { exact: true }).waitFor();
    await page.screenshot({ path: '/checks-results/lioren-admin-records-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Admin DTE diagnostics overflow mobile width');
    await page.screenshot({ path: '/checks-results/lioren-admin-records-mobile.png', fullPage: true });
    diagnosticsFailed = true; await page.getByRole('button', { name: 'Actualizar registros' }).click();
    await page.getByRole('alert').filter({ hasText: 'Diagnóstico temporalmente no disponible.' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Control de registros de NexoPOS' }).count(), 0);
    diagnosticsFailed = false; await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await page.getByRole('heading', { name: 'Control de registros de NexoPOS' }).waitFor();
    console.log('PASS: superadmin has per-client historical diagnostics, mobile layout and retry without false zero values');
    assert.deepEqual(errors, []);
    console.log('PASS: mobile layout stays usable and failed provider queries display unknown values rather than zeros');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
