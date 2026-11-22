// Comprueba una vista local o el contenedor aislado de CI con datos ficticios y API simulada.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const base = process.env.CLIENT_UI_BASE || 'http://127.0.0.1:5174';
  assert.ok(['localhost', '127.0.0.1', 'release-web'].includes(new URL(base).hostname), 'Use a local preview.');
  const browser = await chromium.launch({ ...(process.env.CLIENT_UI_BROWSER === 'chromium' ? {} : { channel: 'chrome' }), headless: true });
  const output = path.resolve(process.env.CLIENT_UI_OUTPUT || path.join(__dirname, '../../node_modules/.cache/create-client-preview'));
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const user = { id: 'superadmin', email: 'superadmin@example.test', name: 'Superadmin', role: 'SUPER_ADMIN', tenantId: 'platform', branchId: null };
      await context.addInitScript(user => {
        localStorage.setItem('token', 'test-superadmin-token');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('theme', 'dark');
      }, user);
      let posts = 0;
      await context.routeWebSocket('**/*', socket => socket.close());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        const endpoint = url.pathname;
        if (endpoint.includes('/api/')) {
          if (endpoint.endsWith('/auth/me')) return json({ user });
          if (endpoint.endsWith('/notifications/unread-count')) return json({ count: 0 });
          if (endpoint.endsWith('/notifications')) return json([]);
          if (endpoint.endsWith('/welcome-email')) return json({ configured: false, reason: 'Datos de prueba', users: [] });
          if (endpoint.endsWith('/admin/tenants') && request.method() === 'POST') {
            posts++;
            assert.equal(request.headers().authorization, 'Bearer test-superadmin-token');
            const data = request.postDataJSON();
            assert.equal(data.email, 'admin@example.test');
            assert.equal(data.companyName, 'Almacen de prueba');
            assert.equal(data.userName, 'Admin de prueba');
            assert.equal(data.rut, undefined);
            if (posts === 1) return json({ message: 'El correo ya esta registrado.' }, 409);
            await new Promise(resolve => setTimeout(resolve, 300));
            return json({ tenant: { id: 'new-client' } }, 201);
          }
          if (endpoint.endsWith('/admin/tenants')) return json({ data: [], total: 0, lastPage: 1 });
          if (endpoint.endsWith('/admin/tenants/new-client')) return json({
            id: 'new-client', name: 'Almacen de prueba', slug: 'almacen-de-prueba', status: 'ACTIVE', billingStatus: 'ACTIVE',
            createdAt: '2026-11-21T12:00:00Z', updatedAt: '2026-11-21T12:00:00Z', rut: null, phone: '912345678', address: null, giro: null,
            plan: null, settings: { maxUsers: 3, maxBranches: 1, maxRegisters: 1 }, invoices: [], users: [], branches: [],
            _count: { users: 1, branches: 1, products: 0, sales: 0, customers: 0, purchases: 0 },
          });
          return json({});
        }
        if (url.origin === new URL(base).origin) return route.continue();
        return route.abort();
      });
      await page.goto(base + '/admin/tenants');
      await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Nombre de la empresa').fill('Descartar');
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
      dialog = page.getByRole('dialog');
      assert.equal(await dialog.getByLabel('Nombre de la empresa').inputValue(), '');
      await dialog.getByRole('button', { name: 'Crear cliente', exact: true }).click();
      assert.equal(posts, 0, 'Required fields should prevent submission.');
      await dialog.getByLabel('Nombre de la empresa').fill(' Almacen de prueba ');
      await dialog.locator('input[type="tel"]').fill('912345678');
      await dialog.getByLabel('Nombre del administrador').fill('Admin de prueba');
      await dialog.getByLabel('Correo del administrador').fill('ADMIN@example.test');
      await dialog.locator('#client-initial-password').fill('password123');
      await dialog.getByRole('button', { name: 'Mostrar', exact: false }).click();
      assert.equal(await dialog.locator('#client-initial-password').getAttribute('type'), 'text');
      await dialog.getByRole('button', { name: 'Ocultar', exact: false }).click();
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1, 'Dialog fits viewport.');
      await dialog.screenshot({ path: path.join(output, `new-client-${viewport.width}.png`) });
      await dialog.getByRole('button', { name: 'Crear cliente', exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(await dialog.getByLabel('Correo del administrador').inputValue(), 'ADMIN@example.test');
      await dialog.getByRole('button', { name: 'Crear cliente', exact: true }).click();
      await page.waitForURL('**/admin/tenants/new-client');
      await page.getByRole('heading', { name: 'Almacen de prueba', exact: true }).waitFor();
      assert.equal(posts, 2);
      assert.equal(await page.evaluate(() => localStorage.getItem('token')), 'test-superadmin-token');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role), 'SUPER_ADMIN');
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('PASS: desktop/mobile dialog, required fields, cancel reset, password visibility, duplicate error, successful creation, navigation and preserved superadmin session.');
    console.log('Screenshots: ' + output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
