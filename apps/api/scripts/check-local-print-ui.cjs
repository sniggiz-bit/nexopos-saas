// Driver and payment fixtures only; no real sale, fiscal emission or physical print.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, firefox } = require('/tmp/ui-check/node_modules/playwright');
const origin = 'http://release-web';
const local = 'https://localhost:18443';
(async () => {
  const fixture = JSON.parse(await fs.readFile('/checks-results/context.json', 'utf8'));
  for (const [name, browserType] of [['chromium', chromium], ['firefox', firefox]]) {
    const browser = await browserType.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'serial', { configurable: true, value: undefined });
        window.__localPrint = { frames: 0, dialogs: 0 };
        window.print = () => { window.__localPrint.dialogs++; };
        new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) if (node.id === 'print-iframe') window.__localPrint.frames++; }).observe(document, { childList: true, subtree: true });
      });
      let popups = 0; page.on('popup', () => popups++);
      const user = { ...fixture.customerUser, modules: ['POS'] };
      const product = { id: '20000000-0000-4000-8000-000000000005', name: 'Prueba USB genérica', sku: 'USB-TEST', price: 1190, stock: 20, unitType: 'UNIT', priceTiers: [], isActive: true };
      const saleId = '40000000-0000-4000-8000-000000000001';
      const token = 'a'.repeat(64); const printer = 'POS-80-Series';
      let mode = 'internal'; let failed = false; const sales = [], jobs = [], printData = [];
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Content-Type': 'application/json' };
      await page.context().route(local + '/**', async route => {
        const req = route.request();
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        assert.equal(req.headers().authorization, 'Bearer ' + token);
        const path = new URL(req.url()).pathname;
        if (path === '/printers') return route.fulfill({ headers, body: JSON.stringify({ ok: true, printers: [{ name: printer, port: 'USB005', offline: false }, { name: 'POS-58-Series', port: 'USB003', offline: true }] }) });
        assert.equal(path, '/jobs'); assert.equal(req.method(), 'POST');
        const job = req.postDataJSON(); jobs.push(job); assert.equal(job.printer, printer); assert.match(job.id, /^[a-f0-9-]{36}$/);
        assert.deepEqual([...Buffer.from(job.data, 'base64').subarray(0, 2)], [27, 64]);
        return route.fulfill({ status: failed ? 503 : 200, headers, body: JSON.stringify(failed ? { error: 'Uncertain spool outcome' } : { ok: true, spoolId: jobs.length }) });
      });
      await page.context().route('**/api/**', async route => {
        const req = route.request(); const path = new URL(req.url()).pathname; let body;
        if (path === '/api/auth/me') body = { user };
        else if (path === '/api/products') body = { data: [product], total: 1, page: 1, limit: 50, totalPages: 1 };
        else if (['/api/categories', '/api/customers', '/api/quotes'].includes(path)) body = [];
        else if (path === '/api/branches') body = [{ id: user.branchId, name: 'Sucursal de prueba' }];
        else if (path.startsWith('/api/shifts/current/')) body = { id: 'shift-fixture', branchId: user.branchId, status: 'OPEN', startTime: new Date().toISOString(), openedByUserId: user.id, initialAmount: 0 };
        else if (path === '/api/tenants/' + user.tenantId) body = { id: user.tenantId, name: 'Prueba USB', settings: {} };
        else if (path === '/api/dte-config/sales-mode') body = { mode };
        else if (path === '/api/sales' && req.method() === 'POST') {
          sales.push(req.postDataJSON());
          body = { id: saleId, tenantId: user.tenantId, branchId: user.branchId, total: 1190, status: 'COMPLETED', dteType: mode === 'internal' ? 0 : 39, dteStatus: mode === 'internal' ? 'INTERNO' : 'PENDIENTE_SII', dteProviderId: mode === 'internal' ? null : 'fixture', dteFolio: mode === 'internal' ? null : 16608, dteVerifiedAt: mode === 'internal' ? null : new Date().toISOString(), dtePdfUrl: mode === 'internal' ? null : '/api/sales/' + saleId + '/dte/pdf', createdAt: new Date().toISOString(), items: [{ quantity: 1, price: 1190, product }], payments: [{ paymentMethod: 'CASH', amount: 1190 }] };
        } else if (path === '/api/sales/' + saleId + '/dte/print-data') {
          assert.equal(req.headers().authorization, 'Bearer ' + fixture.customerToken); printData.push(req.url());
          const params = new URL(req.url()).searchParams, format = params.get('format'), width = format === '58mm' ? 384 : 576;
          return route.fulfill({ headers: { 'Content-Type': 'application/vnd.nexopos.escpos', 'X-NexoPOS-Print-Format': format, 'X-NexoPOS-Print-Width': String(width) }, body: Buffer.from([27, 64, 29, 76, 0, 0, 29, 87, width & 255, width >> 8, 10, 10]) });
        } else if (/\/dte\/pdf$|\/receipts\//.test(path)) throw Error('Local silent printing must not request a PDF preview');
        else return route.continue();
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
      });
      await page.goto(origin);
      await page.evaluate(({ token, user }) => { localStorage.clear(); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }, { token: fixture.customerToken, user });
      await page.goto(origin + '/pos#nexopos-printer=' + encodeURIComponent(JSON.stringify({ token, printer })));
      await page.getByRole('heading', { name: 'Punto de Venta', exact: true }).waitFor();
      await page.getByTitle('Configuración de impresión', { exact: true }).click();
      await page.getByText('Conectado (Windows)', { exact: true }).waitFor();
      assert.equal(new URL(page.url()).hash, '', 'Pairing credential must be removed from the URL');
      assert.equal(await page.getByRole('combobox', { name: 'Conexión directa', exact: true }).inputValue(), 'local');
      assert.equal(await page.getByRole('combobox', { name: 'Impresora instalada', exact: true }).inputValue(), printer);
      assert(await page.getByRole('combobox', { name: 'Impresora instalada', exact: true }).locator('option').filter({ hasText: 'POS-58-Series' }).evaluate(option => option.disabled), 'Offline printer option must be disabled');
      assert.equal(await page.getByRole('combobox', { name: 'Velocidad serial', exact: true }).count(), 0);
      await page.screenshot({ path: '/checks-results/local-print-' + name + '.png' });
      await page.getByRole('button', { name: 'Cerrar configuración de impresión', exact: true }).click();
      const checkout = async () => { await page.getByText(product.name, { exact: true }).first().click(); await page.getByRole('button', { name: /COBRAR/ }).click(); await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).click(); };
      await checkout(); await page.getByText('Enviado a la impresora', { exact: true }).waitFor();
      assert.equal(sales.length, 1); assert.equal(jobs.length, 1); assert.equal(printData.length, 0); assert.equal(sales[0].dteType, 0);
      assert(Buffer.from(jobs[0].data, 'base64').toString('ascii').includes('NO ACREDITA EMISION DTE'));
      await page.getByRole('button', { name: /Cerrar/ }).last().click(); mode = 'fiscal';
      await page.getByTitle('Configuración de impresión', { exact: true }).click(); await page.getByRole('button', { name: '58mm', exact: true }).click(); await page.getByRole('button', { name: 'Cerrar configuración de impresión', exact: true }).click();
      await checkout(); await page.getByText('Enviado a la impresora', { exact: true }).waitFor();
      assert.equal(sales.length, 2); assert.equal(jobs.length, 2); assert.equal(printData.length, 1); assert.equal(sales[1].dteType, 39); assert(printData[0].includes('format=58mm'));
      failed = true; await page.getByRole('button', { name: 'Reimprimir boleta', exact: true }).click();
      await page.getByText('Venta guardada. Impresión pendiente.', { exact: true }).waitFor();
      assert.equal(sales.length, 2); assert.equal(jobs.length, 3); assert.equal(new Set(jobs.map(j => j.id)).size, 3);
      assert.equal(popups, 0); assert.deepEqual(await page.evaluate(() => window.__localPrint), { frames: 0, dialogs: 0 }); assert.deepEqual(errors, []);
      console.log('PASS local driver ' + name + ': generic USB queue without Web Serial, pairing, internal receipt, stamped boleta, no dialogs and no sale duplication on uncertain delivery');
    } catch (error) { console.error('Local driver UI failed in ' + name); throw error; }
    finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
