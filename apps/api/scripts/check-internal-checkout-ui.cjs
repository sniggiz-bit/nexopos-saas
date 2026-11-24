const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('/tmp/ui-check/node_modules/playwright');
const origin = 'http://release-web';
(async () => {
  const fixture = JSON.parse(await fs.readFile('/checks-results/context.json', 'utf8'));
  const pdfFixture = await fs.readFile('/checks-results/sale-pdf-fixture.pdf');
  const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--unsafely-treat-insecure-origin-as-secure=http://release-web'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    await page.addInitScript(() => {
      const state = window.__directPrinter = { writes: [], releases: 0, opens: [], closes: 0, fail: false, fallbackFrames: 0 };
      const events = new EventTarget();
      const port = {
        open: async options => { state.opens.push(options.baudRate); },
        close: async () => { state.closes++; },
        writable: { getWriter: () => ({ write: async bytes => { state.writes.push(Array.from(bytes)); if (state.fail) throw Error('Simulated partial printer failure'); }, releaseLock: () => { state.releases++; } }) },
      };
      Object.defineProperty(navigator, 'serial', { configurable: true, value: { requestPort: async () => port, addEventListener: (...args) => events.addEventListener(...args) } });
      window.__disconnectPrinter = () => { const event = new Event('disconnect'); Object.defineProperty(event, 'port', { value: port }); events.dispatchEvent(event); };
      new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) if (node.id === 'print-iframe') state.fallbackFrames++; }).observe(document, { childList: true, subtree: true });
    });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const user = { ...fixture.customerUser, modules: ['POS'] };
    const product = { id: '20000000-0000-4000-8000-000000000005', name: 'Producto de control interno', sku: 'INTERNO-TEST', price: 1190, stock: 20, unitType: 'UNIT', priceTiers: [], isActive: true };
    let mode = 'internal'; let unavailable = false; let saveSucceeds = false; let pdfFailure = false;
    let internalSuccess = false;
    const submissions = []; const pdfRequests = [];
    const saleId = '40000000-0000-4000-8000-000000000001';
    const internalId = '40000000-0000-4000-8000-000000000002';
    const savedSale = () => ({ id: saleId, tenantId: user.tenantId, branchId: user.branchId, branch: { name: 'Sucursal ficticia' }, total: 1190, status: 'COMPLETED', dteType: 39, dteFolio: 16608, dteStatus: 'PENDIENTE_SII', dteProviderId: 'provider-fixture', dteVerifiedAt: new Date().toISOString(), createdAt: new Date().toISOString(), dtePdfUrl: '/api/sales/' + saleId + '/dte/pdf', internalReceiptUrl: '/api/receipts/' + saleId, items: [], payments: [] });
    await page.context().route('**/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname; let body;
      if (path === '/api/auth/me') body = { user };
      else if (path === '/api/products') body = { data: [product], total: 1, page: 1, limit: 50, totalPages: 1 };
      else if (path === '/api/categories' || path === '/api/customers' || path === '/api/quotes') body = [];
      else if (path === '/api/branches') body = [{ id: user.branchId, name: 'Sucursal ficticia' }];
      else if (path.startsWith('/api/shifts/current/')) body = { id: 'shift-fixture', branchId: user.branchId, status: 'OPEN', startTime: new Date().toISOString(), openedByUserId: user.id, initialAmount: 0 };
      else if (path === '/api/tenants/' + user.tenantId) body = { id: user.tenantId, name: 'Negocio ficticio', settings: {} };
      else if (path === '/api/dte-config/sales-mode') {
        await route.fulfill({ status: unavailable ? 503 : 200, contentType: 'application/json', body: JSON.stringify(unavailable ? { message: 'Consulta no disponible' } : { mode }) }); return;
      } else if (/^\/api\/(sales\/[a-zA-Z0-9-]+\/dte\/pdf|receipts\/[a-zA-Z0-9-]+)$/.test(path)) {
        assert.equal(request.method(), 'GET');
        assert.equal(request.headers().authorization === 'Bearer ' + fixture.customerToken, true, 'PDF requests must carry the current session');
        if (path.includes('/dte/pdf')) assert(['58mm', '80mm', 'A4'].includes(new URL(request.url()).searchParams.get('format')), 'Fiscal boleta must use the selected system format');
        pdfRequests.push(path);
        await route.fulfill(pdfFailure ? { status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) } : { status: 200, contentType: 'application/pdf', body: pdfFixture }); return;
      } else if (path === '/api/sales' && request.method() === 'GET') {
        body = [savedSale(), { ...savedSale(), id: internalId, dteType: 0, dteStatus: 'INTERNO', dteFolio: null, dteProviderId: null, dteVerifiedAt: null, dtePdfUrl: null, internalReceiptUrl: '/api/receipts/' + internalId }];
      } else if (path === '/api/sales' && request.method() === 'POST') {
        submissions.push(request.postDataJSON());
        if (saveSucceeds) { const sale = savedSale(); if (internalSuccess) Object.assign(sale, { dteType: 0, dteStatus: 'INTERNO', dteFolio: null, dteProviderId: null, dteVerifiedAt: null, dtePdfUrl: null, items: [{ quantity: 1, price: 1190, product }], payments: [{ paymentMethod: 'CASH', amount: 1190 }] }); await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(sale) }); return; }
        // Exercise the real submit handler without creating data or printing.
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Fin de prueba de interfaz' }) }); return;
      } else if (path.startsWith('/api/sales/') && request.method() !== 'GET') {
        throw Error('Opening a document must not modify a sale or emit another document.');
      } else { await route.continue(); return; }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto(origin);
    await page.evaluate(({ token, user }) => { localStorage.clear(); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }, { token: fixture.customerToken, user });
    const openCheckout = async () => {
      await page.goto(origin + '/pos');
      try {
        await page.getByRole('heading', { name: 'Punto de Venta', exact: true }).waitFor();
        await page.getByText(product.name, { exact: true }).first().click();
        await page.getByRole('button', { name: /COBRAR/ }).click();
      } catch (error) {
        await page.screenshot({ path: '/checks-results/internal-checkout-failure.png', fullPage: true });
        console.error({ url: page.url(), errors, screen: (await page.locator('body').innerText()).slice(0, 1500) });
        throw error;
      }
    };
    // Exercise the actual settings panel and POS against a simulated serial port.
    await page.goto(origin + '/pos');
    await page.getByRole('heading', { name: 'Punto de Venta', exact: true }).waitFor();
    await page.getByTitle('Configuración de impresión', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Velocidad serial', exact: true }).selectOption('115200');
    await page.getByRole('button', { name: '58mm', exact: true }).click();
    await page.getByRole('switch', { name: 'Corte automático de papel', exact: true }).click();
    await page.getByRole('button', { name: 'Conectar impresora serial', exact: true }).click();
    await page.getByText('Conectado (serial)', { exact: true }).waitFor();
    const test = page.getByRole('button', { name: 'Imprimir prueba sin venta', exact: true });
    await test.click(); await page.getByText('Prueba enviada al puerto. Comprueba el texto y el ancho en el papel.', { exact: true }).waitFor();
    const width = bytes => { for (let i = 0; i < bytes.length - 3; i++) if (bytes[i] === 29 && bytes[i + 1] === 87) return bytes[i + 2] + bytes[i + 3] * 256; return null; };
    assert.equal(width(await page.evaluate(() => window.__directPrinter.writes.at(-1))), 384);
    await page.getByRole('button', { name: '80mm', exact: true }).click();
    await page.getByRole('combobox', { name: 'Columnas para 80 mm', exact: true }).selectOption('42');
    await test.click(); await page.waitForFunction(() => window.__directPrinter.writes.length === 2);
    assert.equal(width(await page.evaluate(() => window.__directPrinter.writes.at(-1))), 504);
    await page.getByRole('combobox', { name: 'Columnas para 80 mm', exact: true }).selectOption('48');
    await test.click(); await page.waitForFunction(() => window.__directPrinter.writes.length === 3);
    assert.equal(width(await page.evaluate(() => window.__directPrinter.writes.at(-1))), 576);
    assert.deepEqual(await page.evaluate(() => window.__directPrinter.opens), [115200]);
    assert.equal(submissions.length, 0, 'Printer tests must not create sales');
    await page.getByRole('button', { name: '58mm', exact: true }).click();
    await page.getByRole('switch', { name: 'Auto-imprimir al vender', exact: true }).click();
    await page.screenshot({ path: '/checks-results/direct-printer-settings.png', fullPage: true });
    await page.getByRole('button', { name: 'Cerrar configuración de impresión', exact: true }).click({ position: { x: 10, y: 300 } });
    internalSuccess = true; saveSucceeds = true;
    await page.getByText(product.name, { exact: true }).first().click();
    await page.getByRole('button', { name: /COBRAR/ }).click();
    await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).click();
    await page.waitForFunction(() => window.__directPrinter.writes.length === 4);
    assert.equal(width(await page.evaluate(() => window.__directPrinter.writes.at(-1))), 384);
    assert.equal(submissions.length, 1, 'Closing the settings panel must preserve the printer for the checkout');
    await page.evaluate(() => { window.__directPrinter.fail = true; });
    await page.getByRole('button', { name: 'Reimprimir Ticket', exact: true }).click();
    await page.getByText('Se interrumpió el envío a la impresora. Revisa el papel antes de volver a imprimir.', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__directPrinter.fallbackFrames), 0, 'Partial write must not trigger another print via iframe');
    assert.equal(submissions.length, 1);
    assert.equal(await page.evaluate(() => window.__directPrinter.closes), 1);
    await page.getByTitle('Configuración de impresión', { exact: true }).click();
    await page.evaluate(() => { window.__directPrinter.fail = false; });
    await page.getByRole('button', { name: 'Conectar impresora serial', exact: true }).click();
    await page.getByText('Conectado (serial)', { exact: true }).waitFor();
    await page.evaluate(() => window.__disconnectPrinter());
    await page.getByText('Impresora desconectada. Vuelve a conectarla para imprimir.', { exact: true }).waitFor();
    assert(await test.isDisabled());
    console.log('PASS: real POS shares its port with settings; test tickets cover 58mm and 80mm (42/48 columns); failed writes preserve the sale without automatic duplicate prints');
    submissions.length = 0; internalSuccess = false; saveSucceeds = false;
    await page.evaluate(() => localStorage.setItem('nexopos_print_settings', JSON.stringify({ autoPrint: false, defaultFormat: '80mm', useWebSerial: false })));
    await openCheckout();
    await page.getByText('Comprobante interno · Sin emisión tributaria', { exact: true }).waitFor();
    for (const name of ['Boleta', 'Factura', 'Guía']) assert.equal(await page.getByRole('button', { name: new RegExp(name) }).count(), 0);
    await page.keyboard.press('F2'); await page.keyboard.press('F3');
    await page.screenshot({ path: '/checks-results/internal-checkout-desktop.png', fullPage: true });
    const submitted = page.waitForResponse(response => response.url().endsWith('/api/sales') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).click();
    await submitted;
    assert.equal(submissions.length, 1); assert.equal(submissions[0].dteType, 0);
    assert.equal(submissions[0].items[0].productId, product.id);
    mode = 'fiscal'; await openCheckout();
    await page.getByRole('button', { name: /Factura/ }).waitFor();
    await page.getByRole('button', { name: /Factura/ }).click();
    assert(await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).isDisabled());
    unavailable = true; await openCheckout();
    await page.getByRole('alert').filter({ hasText: 'No se pudo consultar el modo de venta.' }).waitFor();
    await page.keyboard.press('F12');
    assert(await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).isDisabled());
    assert.equal(submissions.length, 1);
    unavailable = false; mode = 'fiscal'; saveSucceeds = true;
    await openCheckout();
    await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).click();
    await page.getByRole('heading', { name: '¡Venta exitosa!', exact: true }).waitFor();
    const openAndCheckPdf = async (button, path) => {
      const popupCreated = page.context().waitForEvent('page');
      const fetched = page.waitForResponse(response => new URL(response.url()).pathname === path);
      await button.click();
      const popup = await popupCreated;
      assert.equal((await fetched).status(), 200);
      await popup.waitForURL(/^blob:/, { waitUntil: 'commit' });
      assert.equal(popup.url().includes(fixture.customerToken), false);
      await popup.close();
    };
    await openAndCheckPdf(page.getByRole('button', { name: /Abrir \/ Imprimir PDF oficial/ }), '/api/sales/' + saleId + '/dte/pdf');
    await openAndCheckPdf(page.getByRole('button', { name: 'Ver Ticket Interno', exact: true }), '/api/receipts/' + saleId);
    await page.getByRole('combobox', { name: 'Formato de impresión' }).selectOption('58mm');
    await openAndCheckPdf(page.getByRole('button', { name: /Reimprimir PDF DTE/ }), '/api/sales/' + saleId + '/dte/pdf');
    assert.equal(submissions.length, 2, 'Opening or reprinting a PDF must not create another sale');
    pdfFailure = true;
    const failedPopupCreated = page.context().waitForEvent('page');
    await page.getByRole('button', { name: /Abrir \/ Imprimir PDF oficial/ }).click();
    const failedPopup = await failedPopupCreated;
    await page.getByText('Venta guardada. No se pudo abrir el PDF oficial. Puedes volver a abrirlo desde Ventas.', { exact: true }).waitFor();
    assert(failedPopup.isClosed());
    assert.equal(await page.getByRole('heading', { name: 'Error en la venta', exact: true }).count(), 0);
    assert.equal(submissions.length, 2);
    await page.screenshot({ path: '/checks-results/sale-pdf-error-preserves-sale.png', fullPage: true });
    pdfFailure = false;
    await page.goto(origin + '/dashboard/sales');
    await openAndCheckPdf(page.getByRole('button', { name: 'Ver Boleta', exact: true }), '/api/sales/' + saleId + '/dte/pdf');
    await openAndCheckPdf(page.getByRole('button', { name: 'Ver Ticket', exact: true }), '/api/receipts/' + internalId);
    assert.equal(submissions.length, 2);
    pdfFailure = true;
    await page.evaluate(() => localStorage.setItem('nexopos_print_settings', JSON.stringify({ autoPrint: true, defaultFormat: '80mm', useWebSerial: false })));
    await openCheckout();
    const automaticPdf = page.waitForResponse(response => new URL(response.url()).pathname === '/api/sales/' + saleId + '/dte/pdf');
    await page.getByRole('button', { name: /CONFIRMAR PAGO/ }).click();
    await automaticPdf;
    await page.getByText('Venta guardada. No se pudo abrir el comprobante. Puedes volver a abrirlo desde Ventas.', { exact: true }).waitFor();
    assert.equal(submissions.length, 3, 'Automatic printing failure must not resubmit a saved sale');
    assert.equal(await page.getByRole('heading', { name: 'Error en la venta', exact: true }).count(), 0);
    assert(pdfRequests.every(path => !path.includes('/api/api/')));
    console.log('PASS: actual POS and sales history open official and internal PDFs with authentication through blob URLs; read/print failures preserve saved sales without duplicate emission');
    assert.deepEqual(errors, []);
    console.log('PASS: active POS checkout submits internal type 0, ignores fiscal shortcuts, retains fiscal customer validation and blocks payment when mode lookup fails');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
