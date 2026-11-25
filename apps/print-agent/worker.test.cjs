const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough, Writable } = require('node:stream');
const { WindowsWorker } = require('./worker.cjs');
function fixture(behavior, options = {}) {
  const state = { launches: 0, kills: 0, requests: [], active: 0, peak: 0 };
  const launch = () => {
    state.launches++; const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = () => { state.kills++; };
    child.stdin = new Writable({ write(bytes, _encoding, done) {
      const request = JSON.parse(bytes.toString()); state.requests.push(request); state.active++; state.peak = Math.max(state.peak, state.active);
      const reply = (result = { ok: true }) => { state.active--; child.stdout.write(JSON.stringify({ id: request.id, ok: true, result }) + '\n'); };
      setImmediate(() => behavior(request, child, reply)); done();
    } });
    if (!options.noReady) setImmediate(() => child.stdout.write('{"ready":true}\n'));
    return child;
  };
  return { state, worker: new WindowsWorker({ launch, startupMs: 100, requestMs: 100, ...options }) };
}
test('reuses one prepared Windows process and serializes all requests', async () => {
  const { state, worker } = fixture((_request, _child, reply) => setTimeout(() => reply({ ok: true, spoolId: 1 }), 5));
  try {
    const results = await Promise.all([worker.request('list'), worker.request('print', { printer: 'Generic USB' }), worker.request('probe', { printer: 'Generic USB' })]);
    assert.equal(results.length, 3); assert.equal(state.launches, 1); assert.equal(state.peak, 1); assert.deepEqual(state.requests.map(r => r.action), ['list', 'print', 'probe']);
  } finally { worker.close(); }
});
test('never replays a print after process loss; a future request can recover', async () => {
  const { state, worker } = fixture((request, child, reply) => request.action === 'print' ? child.emit('close', 1) : reply());
  try {
    await assert.rejects(worker.request('print', { data: 'fixture' }), /No se confirmó/);
    assert.deepEqual(await worker.request('probe'), { ok: true });
    assert.equal(state.launches, 2); assert.equal(state.requests.filter(r => r.action === 'print').length, 1);
  } finally { worker.close(); }
});
test('timeouts fail the uncertain request without replaying it', async () => {
  const { state, worker } = fixture(() => undefined, { requestMs: 20 });
  try { await assert.rejects(worker.request('print'), /No se confirmó/); assert.equal(state.requests.length, 1); assert.equal(state.kills, 1); }
  finally { worker.close(); }
});
test('startup failure and malformed replies release the pending request', async () => {
  const cold = fixture(() => undefined, { noReady: true, startupMs: 20 });
  await assert.rejects(cold.worker.request('print')); assert.equal(cold.state.requests.length, 0); cold.worker.close();
  const corrupt = fixture((_request, child) => child.stdout.write('{broken}\n'));
  await assert.rejects(corrupt.worker.request('print')); assert.equal(corrupt.state.requests.length, 1); corrupt.worker.close();
});
test('shutdown never respawns a process for queued work', async () => {
  let block; const { state, worker } = fixture((_request, _child, reply) => { block = reply; });
  const a = worker.request('print'); const b = worker.request('print');
  const results = Promise.allSettled([a, b]);
  while (!block) await new Promise(resolve => setImmediate(resolve));
  worker.close(); assert((await results).every(r => r.status === 'rejected')); assert.equal(state.launches, 1); assert.equal(state.requests.length, 1);
});
