const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const { chromium } = require('/tmp/ui-check/node_modules/playwright');
const origin = 'http://release-web';
async function auth(page, token, user) {
  await page.goto(origin);
  await page.evaluate(
    ({ token, user }) => {
      localStorage.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user },
  );
}
async function noOverflow(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    'Horizontal overflow',
  );
}
(async () => {
  const fixture = JSON.parse(
    await fs.readFile('/checks-results/context.json', 'utf8'),
  );
  const browser = await chromium.launch({
    headless: true,
    args: ['--unsafely-treat-insecure-origin-as-secure=http://release-web'],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: 'America/Santiago',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => (errors.push(error.message), console.error('BROWSER_ERROR: ' + error.message)));
    await auth(page, fixture.rootToken, fixture.rootUser);
    await page.goto(origin + '/admin/support-knowledge');
    await page
      .getByRole('heading', { name: 'Base de soporte', exact: true, level: 1 })
      .waitFor();
    await page.getByRole('button', { name: 'Nueva pregunta' }).click();
    const question = '¿Cómo preparo el catálogo de prueba?';
    const answer =
      'En Categorías, organiza tu catálogo en familias. Después registra marcas y productos con su imagen principal.';
    await page.getByLabel('Pregunta', { exact: true }).fill(question);
    await page.getByLabel('Respuesta', { exact: true }).fill(answer);
    await page.getByLabel('Visible para').selectOption('BOTH');
    await page.getByLabel('Estado', { exact: true }).selectOption('PUBLISHED');
    await page.getByLabel('Mostrar como pregunta inicial').check();
    await page.getByLabel('Orden de aparición').fill('-100');
    await page.getByRole('button', { name: 'Guardar pregunta' }).click();
    await page
      .getByRole('status')
      .filter({ hasText: 'Pregunta publicada.' })
      .waitFor();
    await noOverflow(page);
    await page.screenshot({
      path: '/checks-results/support-knowledge-desktop.png',
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page);
    await page.screenshot({
      path: '/checks-results/support-knowledge-mobile.png',
      fullPage: true,
    });
    console.log(
      'PASS: administrator publishes scoped knowledge through real desktop/mobile form',
    );
    await page.getByRole('tab', { name: 'Gemini y configuración' }).click();
    await page.route('**/api/support/check-gemini', (route) =>
      route.fulfill({
        json: {
          models: [{ id: 'gemini-fixture', name: 'Modelo de prueba visual' }],
        },
      }),
    );
    await page
      .getByLabel('Clave de Google AI Studio')
      .fill('fixture-visual-key-never-saved');
    await page
      .getByRole('button', { name: 'Verificar conexión y listar modelos' })
      .click();
    await page
      .getByLabel('Modelo', { exact: true })
      .selectOption('gemini-fixture');
    await noOverflow(page);
    await page.screenshot({
      path: '/checks-results/support-gemini-mobile.png',
      fullPage: true,
    });
    await page.unroute('**/api/support/check-gemini');
    console.log(
      'PASS: Gemini configuration lists models through a browser-only fixture; no API key saved or Google request made',
    );
    const userPage = await context.newPage();
    await userPage.setViewportSize({ width: 390, height: 844 });
    userPage.on('pageerror', (error) => (errors.push(error.message), console.error('BROWSER_ERROR: ' + error.message)));
    await userPage.addInitScript(() => { Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true }); });
    await auth(userPage, fixture.customerToken, fixture.customerUser); // localStorage is shared: restore admin before later admin navigation.
    const headers = { Authorization: 'Bearer ' + fixture.customerToken };
    let history = await (
      await userPage.request.get(origin + '/api/support/chat', { headers })
    ).json();
    if (history.sessionId)
      await userPage.request.post(
        origin + '/api/support/conversations/' + history.sessionId + '/action',
        {
          headers: { Authorization: 'Bearer ' + fixture.rootToken },
          data: { action: 'resume' },
        },
      );
    console.log('SUPPORT_BROWSER_CRYPTO=' + JSON.stringify(await userPage.evaluate(() => ({ secure: isSecureContext, randomUUID: typeof crypto.randomUUID, randomValues: typeof crypto.getRandomValues }))));
    await userPage.goto(origin + '/dashboard/branches');
    await userPage
      .getByRole('button', { name: 'Abrir chat de soporte' })
      .click();
    const chat = userPage.getByRole('dialog', {
      name: 'Chat de soporte NexoPOS',
    });
    const [faqResponse] = await Promise.all([
      userPage.waitForResponse(response => response.url().endsWith('/api/support/chat') && response.request().method() === 'POST'),
      chat.getByRole('button', { name: question, exact: true }).click(),
    ]);
    assert.equal(faqResponse.status(), 201, 'The FAQ message should be accepted');
    const faqBody = await faqResponse.json();
    assert(faqBody.messages?.some(message => message.content === answer), 'Expected the published answer; mode=' + faqBody.mode);
    await chat.getByText(answer, { exact: false }).waitFor();
    await noOverflow(userPage);
    await userPage.screenshot({
      path: '/checks-results/support-widget-mobile.png',
      fullPage: true,
    });
    await chat
      .getByRole('button', { name: 'Hablar con soporte', exact: true })
      .click();
    await chat
      .getByRole('status')
      .filter({ hasText: 'Solicitud en espera de atención' })
      .waitFor();
    history = await (
      await userPage.request.get(origin + '/api/support/chat', { headers })
    ).json();
    assert.equal(history.mode, 'WAITING_HUMAN');
    await chat
      .getByLabel('Mensaje para soporte')
      .fill('Detalle visual adicional de mi consulta');
    await chat
      .getByRole('button', { name: 'Enviar mensaje a soporte' })
      .click();
    await chat
      .getByText('Detalle visual adicional de mi consulta', { exact: false })
      .waitFor();
    console.log(
      'PASS: initial question answers from knowledge; explicit handoff pauses bot and retains customer context',
    );
    // Separate context keeps customer credentials and polling isolated from superadmin.
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: 'America/Santiago',
    });
    const adminPage = await adminContext.newPage();
    adminPage.on('pageerror', (error) => (errors.push(error.message), console.error('BROWSER_ERROR: ' + error.message)));
    await auth(adminPage, fixture.rootToken, fixture.rootUser);
    await adminPage.goto(
      origin + '/admin/live-chats?session=' + history.sessionId,
    );
    await adminPage
      .getByRole('button', { name: 'Tomar conversación', exact: true })
      .click();
    await adminPage
      .getByText('Usuario de NexoPOS · En atención', { exact: true })
      .waitFor();
    await adminPage
      .getByLabel('Respuesta al usuario')
      .fill('Te ayudo con la configuración de tu catálogo.');
    await adminPage
      .getByRole('button', { name: 'Enviar respuesta', exact: true })
      .click();
    await chat
      .getByText('Te ayudo con la configuración de tu catálogo.', {
        exact: false,
      })
      .waitFor({ timeout: 15000 });
    await adminPage.screenshot({
      path: '/checks-results/support-inbox-desktop.png',
      fullPage: true,
    });
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await noOverflow(adminPage);
    await adminPage.screenshot({
      path: '/checks-results/support-inbox-mobile.png',
      fullPage: true,
    });
    await adminPage.getByRole('button', { name: 'Marcar resuelta' }).click();
    await adminPage
      .getByText('Usuario de NexoPOS · Resuelto', { exact: true })
      .waitFor();
    await chat
      .getByRole('status')
      .filter({ hasText: 'Consulta resuelta' })
      .waitFor({ timeout: 15000 });
    console.log(
      'PASS: email deep link selects exact conversation; human takeover, reply and resolution work in desktop/mobile UI',
    );
    await userPage.goto(origin + '/admin/support-knowledge');
    await userPage.waitForURL(/dashboard/);
    assert.equal(
      await userPage.getByLabel('Clave de Google AI Studio').count(),
      0,
    );
    const rootHeaders = { Authorization: 'Bearer ' + fixture.rootToken };
    const landingResponse = await adminPage.request.get(origin + '/api/admin/landing', { headers: rootHeaders });
    assert.equal(landingResponse.status(), 200);
    const landingText = await landingResponse.text();
    const landing = landingText ? JSON.parse(landingText) : {};
    const enabledLanding = await adminPage.request.put(origin + '/api/admin/landing', { headers: rootHeaders, data: { ...landing, chatbot: { ...(landing.chatbot || {}), enabled: true } } });
    assert.equal(enabledLanding.status(), 200);
    const publicContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(origin);
    await publicPage
      .getByRole('button', { name: 'Abrir chat de soporte' })
      .click();
    const publicChat = publicPage.getByRole('dialog', {
      name: 'Chat de soporte NexoPOS',
    });
    await publicChat
      .getByRole('button', { name: question, exact: true })
      .click();
    await publicChat.getByText(answer, { exact: false }).waitFor();
    await publicPage.reload();
    await publicPage
      .getByRole('button', { name: 'Abrir chat de soporte' })
      .click();
    await publicChat.getByText(answer, { exact: false }).waitFor();
    await noOverflow(publicPage);
    console.log(
      'PASS: public chat restores history and customer cannot access chatbot configuration',
    );
    assert.deepEqual(errors, []);
    console.log('SUPPORT_UI_CHECKS=6; real external messages=0');
  } catch (error) {
    let index = 0;
    for (const context of browser.contexts()) for (const page of context.pages()) {
      await page.screenshot({ path: '/checks-results/support-failure-' + index++ + '.png', fullPage: true }).catch(() => {});
    }
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
