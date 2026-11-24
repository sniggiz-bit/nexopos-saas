const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = process.env.WEB_SOURCE || '/app/apps/web/src';
const cache = new Map();
function load(name) {
  const file = path.resolve(root, name.endsWith('.ts') ? name : name + '.ts');
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const localRequire = specifier => specifier.startsWith('@/') ? load(specifier.slice(2)) : specifier.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(file), specifier))) : require(specifier);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { SerialPrinter, DirectPrintWriteError } = load('utils/serialPrinter');
const { generateReceiptEscPos, generatePrinterTest } = load('components/pos/receipts/ReceiptToEscPos');
const { receiptText } = load('utils/thermalLayout');
const { printerTestHtml } = load('utils/printerTest');
function inspect(bytes) {
  const lines = []; let line = ''; let width = 1; let columns = 0; let cuts = 0;
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i];
    if (b === 0x1b) {
      const command = bytes[i + 1]; assert([0x40, 0x4d, 0x61, 0x45].includes(command), 'Unexpected ESC command');
      i += command === 0x40 ? 2 : 3; continue;
    }
    if (b === 0x1d) {
      const command = bytes[i + 1];
      if (command === 0x57) { columns = (bytes[i + 2] + bytes[i + 3] * 256) / 12; i += 4; }
      else if (command === 0x4c) i += 4;
      else if (command === 0x21) { width = (bytes[i + 2] >> 4) + 1; i += 3; }
      else if (command === 0x56) { cuts++; i += 4; }
      else throw Error('Unexpected GS command');
      continue;
    }
    if (b === 10) { assert(line.length * width <= columns, 'Text exceeds printable columns: ' + line); lines.push(line); line = ''; }
    else { assert(b >= 32 && b <= 126, 'Only sanitized portable text may reach the printer'); line += String.fromCharCode(b); }
    i++;
  }
  return { text: lines.join('\n'), columns, cuts };
}
function fake() {
  const info = { writes: [], locks: 0, releases: 0, requests: 0, closes: 0, rates: [], failAt: 0, cancel: false, syncThrow: false, listeners: [] };
  const port = {
    open: async options => { info.rates.push(options.baudRate); },
    close: async () => { assert.equal(info.locks, 0, 'Release writer before closing'); info.closes++; },
    writable: { getWriter() {
      assert.equal(info.locks, 0, 'Jobs must not hold competing writer locks'); info.locks++;
      return { write: async bytes => { await new Promise(resolve => setImmediate(resolve)); info.writes.push(Buffer.from(bytes)); if (info.writes.length === info.failAt) throw Error('Simulated interrupted write'); }, releaseLock: () => { info.locks--; info.releases++; } };
    } },
  };
  const api = { requestPort() { info.requests++; if (info.syncThrow) { info.syncThrow = false; throw Error('Synchronous permission rejection'); } return info.cancel ? Promise.reject(new DOMException('Cancelled', 'NotFoundError')) : Promise.resolve(port); }, addEventListener(_type, listener) { info.listeners.push(listener); } };
  return { info, port, api, printer: new SerialPrinter(() => api) };
}
(async () => {
  const productName = 'Café piñón y descripción de producto completa con presentación familiar y características que deben aparecer hasta esta última palabra';
  const sale = { id: '40000000-0000-4000-8000-000000000001', createdAt: '2026-11-24T12:00:00Z', total: 123456, items: [{ quantity: 2.5, price: 50000, discountAmount: 1544, product: { name: productName } }], payments: [{ paymentMethod: 'CASH', amount: 130000 }] };
  for (const [format, options, columns] of [['58mm', { cutPaper: false }, 32], ['80mm', { cutPaper: true }, 48], ['80mm', { columns80: 42, cutPaper: false }, 42]]) {
    const output = inspect(generateReceiptEscPos(sale, { name: 'Almacén de prueba con nombre comercial largo', address: 'Dirección larga para comprobar ambos anchos' }, format, options));
    assert.equal(output.columns, columns); assert.equal(output.cuts, options.cutPaper ? 1 : 0);
    assert(output.text.replace(/\s/g, '').includes(receiptText(productName).replace(/\s/g, '')), 'No product-name truncation');
    for (const value of ['123.456', '6.544', 'NO ACREDITA EMISION DTE']) assert(output.text.includes(value));
    const test = inspect(generatePrinterTest(format, options)); assert.equal(test.columns, columns); assert(test.text.replace(/\s/g, '').includes('SINVENTANIDOCUMENTOTRIBUTARIO'));
    console.log('PASS width ' + format + ': ' + columns + ' columns, amounts and complete names, cutter option');
  }
  for (const format of ['58mm', '80mm', 'A4']) {
    const html = printerTestHtml(format);
    assert(html.includes('Formato: ' + format)); assert(html.replace(/\s+/g, ' ').includes('SIN VENTA NI DOCUMENTO TRIBUTARIO'));
    assert(html.includes('width:' + (format === 'A4' ? '100%' : format))); assert(!html.includes('<script'));
  }
  console.log('PASS native test layouts for 58mm, 80mm and A4 without a sale or fiscal document');
  const attack = inspect(generateReceiptEscPos({ ...sale, items: [{ ...sale.items[0], product: { name: 'Producto\x1b@\x1dVB\x00<script>😀' } }] }, undefined, '58mm'));
  assert.equal(attack.cuts, 1);
  const f = fake(); let updates = 0; const unsubscribe = f.printer.subscribe(() => updates++);
  const connected = await Promise.all([f.printer.connect(115200), f.printer.connect(115200)]);
  assert.equal(connected[0], f.port); assert.equal(f.info.requests, 1); assert.deepEqual(f.info.rates, [115200]);
  const a = new Uint8Array(2300).fill(65), b = new Uint8Array(1300).fill(66);
  const first = f.printer.printBytes(a); a.fill(90);
  assert.deepEqual(await Promise.all([first, f.printer.printBytes(b)]), [true, true]);
  assert.deepEqual(Buffer.concat(f.info.writes), Buffer.concat([Buffer.alloc(2300, 65), Buffer.alloc(1300, 66)]));
  assert(f.info.writes.every(bytes => bytes.length <= 1024)); assert.equal(f.info.releases, 2);
  await f.printer.disconnect(); assert.equal(f.info.closes, 1); assert.equal(await f.printer.printBytes(b), false); assert(updates > 0); unsubscribe();
  console.log('PASS shared connection, selected baud rate, queued jobs, backpressure chunks and released locks');
  const failed = fake(); await failed.printer.connect(); failed.info.failAt = 2;
  await assert.rejects(failed.printer.printBytes(new Uint8Array(2200)), DirectPrintWriteError);
  assert.equal(failed.info.releases, 1); assert.equal(failed.info.closes, 1); assert.equal(failed.printer.getSnapshot().status, 'error'); assert.equal(failed.printer.getSnapshot().isPrinting, false);
  assert.equal(await failed.printer.printBytes(new Uint8Array(10)), false);
  await failed.printer.connect(); assert.equal(await failed.printer.printBytes(new Uint8Array(10)), true);
  console.log('PASS partial failures release locks, close the failed connection and require explicit reconnection');
  const cancelled = fake(); cancelled.info.cancel = true; assert.equal(await cancelled.printer.connect(), null); assert.equal(cancelled.printer.getSnapshot().status, 'disconnected');
  cancelled.info.cancel = false; cancelled.info.syncThrow = true; assert.equal(await cancelled.printer.connect(), null); assert.equal(await cancelled.printer.connect(), cancelled.port);
  cancelled.info.listeners[0]({ target: cancelled.port }); assert.equal(cancelled.printer.getSnapshot().status, 'disconnected'); assert.equal(await cancelled.printer.printBytes(b), false); assert.equal(cancelled.info.listeners.length, 1);
  const unsupported = new SerialPrinter(() => undefined); assert.equal(unsupported.getSnapshot().status, 'unavailable'); assert.equal(await unsupported.connect(), null);
  console.log('PASS cancellation, reconnect, unplug events and unsupported browsers');
})().catch(error => { console.error(error); process.exitCode = 1; });
