const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PUBLIC_SEO_LOCAL ? 'playwright' : '/tmp/ui-check/node_modules/playwright');
const origin = process.env.PUBLIC_SEO_ORIGIN || 'http://release-web';
const output = process.env.PUBLIC_SEO_OUTPUT || '/checks-results';
async function metadata(page, pathname, index) {
  await page.waitForFunction(({ canonical, index }) => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') === canonical && Boolean(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')?.startsWith('index,')) === index, { canonical: 'https://nexopos.cl' + pathname, index });
  assert.equal(await page.locator('head link[rel="canonical"]').count(), 1);
  assert.equal(await page.locator('head meta[name="description"]').count(), 1);
  assert.equal(await page.locator('head meta[property="og:title"]').getAttribute('content'), await page.title());
  assert.equal(await page.locator('head meta[name="twitter:title"]').getAttribute('content'), await page.title());
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ ...(process.env.PUBLIC_SEO_LOCAL ? { channel: 'chrome' } : {}), args: ['--unsafely-treat-insecure-origin-as-secure=' + origin] });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
    page.setDefaultTimeout(120000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
    await page.locator('.public-hero h1').waitFor();
    await metadata(page, '/', true);
    assert.equal(await page.locator('h1').count(), 1);
    await page.getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
    await page.getByRole('heading', { name: 'Ingreso al Sistema' }).waitFor();
    await metadata(page, '/login', false); assert.equal(await page.locator('#nexopos-structured-data').count(), 0);
    await page.getByRole('link', { name: 'NexoPOS, volver al inicio' }).click();
    await page.waitForURL(url => url.pathname === '/'); await metadata(page, '/', true);
    await page.locator('.public-hero').getByRole('link').click();
    await page.getByRole('heading', { name: 'Crea tu cuenta' }).waitFor(); await metadata(page, '/register', false);
    await page.getByRole('link', { name: 'NexoPOS, volver al inicio' }).click();
    await page.locator('.public-footer').getByRole('link', { name: 'Contacto', exact: true }).click();
    await page.getByRole('heading', { level: 1, name: 'Contacto Comercial' }).waitFor(); await metadata(page, '/contacto', true);
    assert.equal(await page.locator('main h3').count(), 0, 'Public page heading outline');
    const response = await page.goto(origin + '/seo-check-no-such-page', { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 404); await page.getByRole('heading', { level: 1, name: 'Página no encontrada' }).waitFor();
    await page.waitForFunction(() => document.head.querySelector('meta[name="robots"]')?.getAttribute('content')?.startsWith('noindex'));
    await page.goto(origin + '/store/seo-check-no-such-shop', { waitUntil: 'domcontentloaded' });
    await page.getByText('Tienda no encontrada o no disponible', { exact: true }).waitFor();
    await metadata(page, '/store/seo-check-no-such-shop', false);
    await page.goto(origin + '/dashboard/products', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Ingreso al Sistema' }).waitFor(); await metadata(page, '/login', false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.getByRole('navigation', { name: 'Menú móvil' }).getByRole('link', { name: 'Sectores', exact: true }).click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: path.join(output, 'seo-home-mobile.png') });
    await page.setViewportSize({ width: 1366, height: 900 }); await page.screenshot({ path: path.join(output, 'seo-home-desktop.png') });
    assert.deepEqual(errors, []);
    console.log('PASS public SEO navigation: unique metadata, route canonicals, login/registration noindex, public headings, missing pages/stores, protected routes and mobile home.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
