// Read-only HTTP checks for the real release server, including responses without JavaScript.
const assert = require('node:assert/strict');
const origin = process.env.PUBLIC_SEO_ORIGIN || 'http://release-web';
const canonicalOrigin = 'https://nexopos.cl';
const paths = ['/', '/contacto', '/soporte', '/terminos', '/privacidad'];
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
async function request(path, options = {}) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(20000), ...options });
  return { response, html: await response.text() };
}
function meta(html, attribute, name) {
  return decode(html.match(new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="([^"]*)"`))?.[1] || '');
}
(async () => {
  const titles = new Set();
  for (const path of paths) {
    const { response, html } = await request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Single prerendered H1: ' + path);
    const title = decode(html.match(/<title>([^<]+)<\/title>/)?.[1] || '');
    assert.ok(title && !titles.has(title), 'Unique title: ' + path); titles.add(title);
    assert.ok(meta(html, 'name', 'description').length > 30, 'Useful description: ' + path);
    assert.equal(meta(html, 'property', 'og:title'), title, 'OG title: ' + path);
    assert.equal(meta(html, 'name', 'twitter:title'), title, 'Twitter title: ' + path);
    assert.match(meta(html, 'name', 'robots'), /^index,/);
    const links = Array.from(html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g));
    assert.equal(links.length, 1, 'Single canonical: ' + path);
    assert.equal(links[0][1], canonicalOrigin + path);
    const scripts = Array.from(html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g));
    assert.ok(scripts.length, 'Structured data: ' + path);
    for (const script of scripts) assert.equal(JSON.parse(script[1])['@context'], 'https://schema.org');
    assert.doesNotMatch(html, /<h1[^>]*>[^<]*Cargando/);
    if (path === '/') { assert.match(html, /15 días/); assert.match(html, /public-tool-card/); assert.match(html, /"@type":"WebSite"/); }
  }
  for (const path of ['/landing', '/landing/', '/index.html', '/contacto/', '/contacto/index.html']) {
    const { response } = await request(path); assert.equal(response.status, 301, path);
    const target = new URL(response.headers.get('location'), origin);
    assert.equal(target.pathname, path.startsWith('/contacto') ? '/contacto' : '/');
  }
  for (const path of ['/login', '/register', '/dashboard', '/dashboard/products', '/admin', '/admin/branches', '/pos', '/auth/sso']) {
    const { response, html } = await request(path);
    assert.equal(response.status, 200, path); assert.match(response.headers.get('x-robots-tag') || '', /noindex/, path);
    assert.match(meta(html, 'name', 'robots'), /noindex/, path);
    assert.doesNotMatch(html, /rel="canonical" href="https:\/\/nexopos.cl\/"/, 'Private route is not a home duplicate: ' + path);
  }
  for (const path of ['/seo-check-page-that-does-not-exist', '/assets/seo-check-missing.js']) {
    const { response, html } = await request(path); assert.equal(response.status, 404, path);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/); assert.match(html, /Página no encontrada/);
  }
  const { response: verificationResponse, html: verification } = await request('/googledf3aaa8616c6306f.html');
  assert.equal(verificationResponse.status, 200); assert.equal(verification.trim(), 'google-site-verification: googledf3aaa8616c6306f.html');
  const { html: robots } = await request('/robots.txt'); assert.match(robots, /Sitemap: https:\/\/nexopos.cl\/sitemap.xml/); assert.doesNotMatch(robots, /Disallow: \/(?:login|register|admin|dashboard|pos)/);
  const { html: sitemap } = await request('/sitemap.xml'); const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
  assert.deepEqual(locations.sort(), paths.map(path => canonicalOrigin + path).sort()); assert.doesNotMatch(sitemap, /2024|\/landing|\/login|\/register/);
  const { response: shellResponse, html: shell } = await request('/app-shell.html'); assert.equal(shellResponse.status, 200); assert.match(meta(shell, 'name', 'robots'), /noindex/); assert.match(shell, /<div id="root"><\/div>/);
  const { html: worker } = await request('/sw.js'); assert.match(worker, /app-shell\.html/);
  const { response: apiResponse } = await request('/api/support/chat'); assert.equal(apiResponse.status, 401);
  if (new URL(origin).hostname === 'release-web') {
    const { response } = await request('/', { headers: { Host: 'www.nexopos.cl' } }); assert.equal(response.status, 301); assert.equal(response.headers.get('location'), 'https://nexopos.cl/');
    const { response: verification } = await request('/googledf3aaa8616c6306f.html', { headers: { Host: 'www.nexopos.cl' } }); assert.equal(verification.status, 200);
  }
  console.log('PASS public SEO: prerendered pages, unique metadata and schema, canonicals, redirects, real 404s, noindex application, Google verification, sitemap and offline app shell.');
})().catch(error => { console.error(error); process.exitCode = 1; });
