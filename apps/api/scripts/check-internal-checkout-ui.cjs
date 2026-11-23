const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('/tmp/ui-check/node_modules/playwright');
const origin = 'http://release-web';
(async () => {
  const fixture = JSON.parse(await fs.readFile('/checks-results/context.json', 'utf8'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const user = { ...fixture.customerUser, modules: ['POS'] };
    const product = { id: '20000000-0000-4000-8000-000000000005', name: 'Producto de control interno', sku: 'INTERNO-TEST', price: 1190, stock: 20, unitType: 'UNIT', priceTiers: [], isActive: true };
    let mode = 'internal'; let unavailable = false; const submissions = [];
    await page.route('**/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname; let body;
      if (path === '/api/auth/me') body = { user };
      else if (path === '/api/products') body = { data: [product], total: 1, page: 1, limit: 50, totalPages: 1 };
      else if (path === '/api/categories' || path === '/api/customers' || path === '/api/quotes') body = [];
      else if (path === '/api/branches') body = [{ id: user.branchId, name: 'Sucursal ficticia' }];
      else if (path.startsWith('/api/shifts/current/')) body = { id: 'shift-fixture', branchId: user.branchId, status: 'OPEN', initialAmount: 0 };
      else if (path === '/api/tenants/' + user.tenantId) body = { id: user.tenantId, name: 'Negocio ficticio', settings: {} };
      else if (path === '/api/dte-config/sales-mode') {
        await route.fulfill({ status: unavailable ? 503 : 200, contentType: 'application/json', body: JSON.stringify(unavailable ? { message: 'Consulta no disponible' } : { mode }) }); return;
      } else if (path === '/api/sales' && request.method() === 'POST') {
        submissions.push(request.postDataJSON());
        // Exercise the real submit handler without creating data or printing.
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Fin de prueba de interfaz' }) }); return;
      } else { await route.continue(); return; }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto(origin);
    await page.evaluate(({ token, user }) => { localStorage.clear(); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }, { token: fixture.customerToken, user });
    const openCheckout = async () => {
      await page.goto(origin + '/pos');
      await page.getByText(product.name, { exact: true }).first().click();
      await page.getByRole('button', { name: /COBRAR/ }).click();
    };
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
    assert.deepEqual(errors, []);
    console.log('PASS: active POS checkout submits internal type 0, ignores fiscal shortcuts, retains fiscal customer validation and blocks payment when mode lookup fails');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
