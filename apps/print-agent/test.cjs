const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const crypto = require('node:crypto');
const { createHandler } = require('./server.cjs');
test('local printing: origin, authentication, queue isolation and uncertain-job deduplication', async () => {
  const token = 'a'.repeat(64); let calls = 0; let active = 0; let peak = 0;
  const server = http.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = server.address().port;
  server.on('request', createHandler({ token, port, list: async () => [{ name: 'POS-80-Series', port: 'USB005', offline: false }], print: async job => { calls++; active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 15)); active--; if (job.printer === 'fail') throw Error('Uncertain delivery'); return { ok: true, spoolId: 123 }; } }));
  const url = 'http://127.0.0.1:' + port;
  const request = (route, body, headers = {}) => fetch(url + route, { method: body ? 'POST' : 'GET', headers: { Origin: 'https://nexopos.cl', Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  const job = () => ({ id: crypto.randomUUID(), createdAt: Date.now(), printer: 'POS-80-Series', data: Buffer.from([27, 64, 65, 10]).toString('base64') });
  try {
    assert.equal((await request('/printers', null, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await request('/printers', null, { Authorization: 'Bearer wrong' })).status, 401);
    assert.equal(await new Promise((resolve, reject) => { const req = http.request(url + '/printers', { headers: { Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); }), 403);
    const list = await request('/printers'); assert.equal(list.status, 200); assert.equal(list.headers.get('access-control-allow-origin'), 'https://nexopos.cl'); assert.equal((await list.json()).printers[0].name, 'POS-80-Series');
    const first = job(); const results = await Promise.all([request('/jobs', first), request('/jobs', first)]); assert(results.every(r => r.status === 200)); assert.equal(calls, 1);
    assert.equal((await request('/jobs', { ...first, printer: 'different' })).status, 409); assert.equal(calls, 1);
    assert.equal((await request('/jobs', { ...job(), createdAt: Date.now() - 180000 })).status, 400);
    assert.equal((await request('/jobs', { ...job(), data: 'invalid' })).status, 400);
    const failed = { ...job(), printer: 'fail' }; assert.equal((await request('/jobs', failed)).status, 503); assert.equal((await request('/jobs', failed)).status, 503); assert.equal(calls, 2);
    await Promise.all(Array.from({ length: 4 }, () => request('/jobs', job()))); assert.equal(peak, 1); assert.equal(calls, 6);
    assert.equal((await request('/jobs', job(), { 'Content-Type': 'text/plain' })).status, 415);
    const root = await request('/'); assert.equal(root.headers.get('x-frame-options'), 'DENY'); assert.equal(root.headers.get('cache-control'), 'no-store'); assert((await root.text()).includes('Vincular con NexoPOS'));
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
