// Pruebas de autocompletado en ambos registros con datos ficticios y proveedor simulado.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.env.CLIENT_UI_BASE || 'http://127.0.0.1:5174';
  assert.ok(['localhost', '127.0.0.1', 'release-web'].includes(new URL(base).hostname));
  const output = path.resolve(process.env.CLIENT_UI_OUTPUT || path.join(__dirname, '../../node_modules/.cache/rut-preview'));
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ ...(process.env.CLIENT_UI_BROWSER === 'chromium' ? {} : { channel: 'chrome' }), headless: true });
  try {
    for (const mode of ['admin', 'public']) for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const owner = { id: 'owner', name: 'Camila de prueba', email: 'owner@example.test', role: 'TENANT_ADMIN', tenantId: 'new-tenant', branchId: 'main', modules: [] };
      let currentUser = mode === 'admin' ? { ...owner, id: 'superadmin', role: 'SUPER_ADMIN', tenantId: 'platform' } : null;
      if (currentUser) await context.addInitScript(user => { localStorage.setItem('token', 'fixture-token'); localStorage.setItem('user', JSON.stringify(user)); }, currentUser);
      await context.routeWebSocket('**/*', socket => socket.close());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let lookups = 0;
      let posts = 0;
      let finishLate;
      const lateDone = new Promise(resolve => { finishLate = resolve; });
      await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        const endpoint = url.pathname;
        const json = async (body, status = 200) => {
          try { await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }); }
          catch (error) { if (!request.failure()?.errorText?.includes('ABORTED')) throw error; }
        };
        if (endpoint.includes('/api/')) {
          if (endpoint.includes('/common/registration-rut-lookup/')) {
            lookups++;
            const rut = decodeURIComponent(endpoint.split('/').pop()).replace(/[.-]/g, '');
            if (rut === '333333333') return json({ success: false, message: 'Sin información.' });
            const company = { reasonSocial: 'Empresa ' + rut, giro: 'Giro ' + rut, address: 'Dirección ' + rut };
            if (rut === '111111111') {
              await new Promise(resolve => setTimeout(resolve, 1200));
              try { await json({ success: true, data: company }); } finally { finishLate(); }
              return;
            }
            return json({ success: true, data: company });
          }
          if (endpoint.endsWith('/auth/me')) return json({ user: currentUser });
          if (endpoint.endsWith('/notifications/unread-count')) return json({ count: 0 });
          if (endpoint.endsWith('/notifications')) return json([]);
          if (endpoint.endsWith('/welcome-email')) return json({ configured: false, reason: 'Prueba aislada', users: [] });
          if (request.method() === 'POST' && (endpoint.endsWith('/admin/tenants') || endpoint.endsWith('/auth/register-tenant'))) {
            posts++;
            const body = request.postDataJSON();
            assert.equal(body.rut, '33.333.333-3');
            assert.equal(body.companyName, 'Negocio manual');
            assert.equal(body.giro, 'Giro manual');
            assert.equal(body.address, 'Dirección manual');
            assert.equal(body.userName, owner.name);
            assert.equal(body.email, owner.email);
            assert.ok(body.password.length >= 8);
            if (mode === 'admin') return json({ tenant: { id: 'new-tenant' } }, 201);
            assert.equal(request.headers().authorization, undefined);
            currentUser = owner;
            return json({ access_token: 'new-fixture-token', user: owner, tenant: { id: 'new-tenant' } }, 201);
          }
          if (endpoint.endsWith('/admin/tenants')) return json({ data: [], total: 0, lastPage: 1 });
          if (endpoint.endsWith('/admin/tenants/new-tenant')) return json({
            id: 'new-tenant', name: 'Negocio manual', slug: 'negocio-manual', status: 'ACTIVE', billingStatus: 'ACTIVE',
            createdAt: '2026-11-23T12:00:00Z', updatedAt: '2026-11-23T12:00:00Z', rut: '33.333.333-3', phone: '912345678',
            plan: null, settings: { maxUsers: 3, maxBranches: 1, maxRegisters: 1 }, invoices: [], users: [], branches: [],
            _count: { users: 1, branches: 1, products: 0, sales: 0, customers: 0, purchases: 0 },
          });
          return json({});
        }
        return url.origin === new URL(base).origin ? route.continue() : route.abort();
      });
      await page.goto(base + (mode === 'admin' ? '/admin/tenants' : '/register'));
      if (mode === 'admin') await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
      const form = mode === 'admin' ? page.getByRole('dialog') : page.locator('form');
      const rut = form.getByLabel('RUT del negocio (opcional)', { exact: true });
      await rut.fill('12345678-9');
      await page.waitForTimeout(600);
      assert.equal(lookups, 0, 'An invalid verifier must not trigger a lookup.');
      await rut.fill('12345678-5');
      await form.getByText('Datos del RUT consultados.', { exact: false }).waitFor();
      assert.equal(await form.getByLabel('Nombre de la empresa', { exact: true }).inputValue(), 'Empresa 123456785');
      assert.equal(await form.getByLabel('Giro comercial (opcional)', { exact: true }).inputValue(), 'Giro 123456785');
      assert.equal(await form.getByLabel('Dirección (opcional)', { exact: true }).inputValue(), 'Dirección 123456785');
      const slowRequest = page.waitForRequest(request => request.url().includes('/registration-rut-lookup/11.111.111-1'));
      await rut.fill('11111111-1');
      await slowRequest;
      await form.getByLabel('Nombre de la empresa', { exact: true }).fill('Nombre revisado');
      await rut.fill('22222222-2');
      await form.getByText('Datos del RUT consultados.', { exact: false }).waitFor();
      await lateDone;
      assert.equal(await form.getByLabel('Nombre de la empresa', { exact: true }).inputValue(), 'Nombre revisado');
      assert.equal(await form.getByLabel('Giro comercial (opcional)', { exact: true }).inputValue(), 'Giro 222222222');
      assert.equal(await form.getByLabel('Dirección (opcional)', { exact: true }).inputValue(), 'Dirección 222222222');
      if (mode === 'admin') { await form.evaluate(element => { element.scrollTop = 0; }); await form.screenshot({ path: path.join(output, `rut-${mode}-${width}.png`) }); }
      else await page.screenshot({ path: path.join(output, `rut-${mode}-${width}.png`), fullPage: true });
      await rut.fill('33333333-3');
      await form.getByText('No hay datos disponibles para este RUT.', { exact: false }).waitFor();
      await form.getByLabel('Nombre de la empresa', { exact: true }).fill('Negocio manual');
      await form.getByLabel('Giro comercial (opcional)', { exact: true }).fill('Giro manual');
      await form.getByLabel('Dirección (opcional)', { exact: true }).fill('Dirección manual');
      await form.getByLabel(mode === 'admin' ? 'Nombre del administrador' : 'Nombre completo', { exact: true }).fill(owner.name);
      await form.getByLabel(mode === 'admin' ? 'Correo del administrador' : 'Correo electrónico', { exact: true }).fill(owner.email);
      await form.locator('input[type="tel"]').fill('912345678');
      if (mode === 'admin') await form.locator('#client-initial-password').fill('Fixture-password-123');
      await form.getByRole('button', { name: mode === 'admin' ? 'Crear cliente' : 'Crear cuenta gratis', exact: mode === 'admin' }).click();
      if (mode === 'admin') { await page.waitForURL('**/admin/tenants/new-tenant'); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role), 'SUPER_ADMIN'); }
      else await page.getByRole('heading', { name: '¡Espacio creado!', exact: true }).waitFor();
      assert.equal(posts, 1);
      assert.equal(lookups, 4);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('PASS: RUT autofill in public/admin registration on desktop/mobile, valid verifier, stale responses, manual edits, provider misses and persisted business fields.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
