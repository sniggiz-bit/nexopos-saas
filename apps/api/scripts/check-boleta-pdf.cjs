// Uses only fictitious XML; checks the actual rendered PDF at thermal-printer resolution.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { readBarcodes, prepareZXingModule } = require('zxing-wasm/reader');
const { readIssuedBoleta, renderBoletaPdf } = require('../dist/dte/boleta-pdf');
const { issuedBoleta } = require('./fixtures/issued-boleta.cjs');
async function main() {
  const output = process.env.BOLETA_OUTPUT || '/checks-results'; fs.mkdirSync(output, { recursive: true });
  const wasm = fs.readFileSync(path.resolve(path.dirname(require.resolve('zxing-wasm/reader')), '../../reader/zxing_reader.wasm'));
  await prepareZXingModule({ overrides: { wasmBinary: new Uint8Array(wasm) } });
  const branding = { name: 'Mi almacén de prueba', resolution: '99', resolutionDate: '2014-10-21' };
  for (const format of ['58mm', '80mm', 'A4']) {
    const f = issuedBoleta(format === 'A4' ? 60 : 1);
    const boleta = readIssuedBoleta(f.document, f.expected);
    const pdf = path.join(output, 'boleta-' + format + '.pdf');
    fs.writeFileSync(pdf, await renderBoletaPdf(boleta, branding, format));
    const prefix = path.join(output, 'boleta-' + format);
    execFileSync('pdftoppm', ['-r', '203', '-png', pdf, prefix]);
    const pages = fs.readdirSync(output).filter(name => name.startsWith('boleta-' + format + '-') && name.endsWith('.png')).sort();
    let decoded = 0;
    for (const page of pages) {
      const results = await readBarcodes(fs.readFileSync(path.join(output, page)), { formats: ['PDF417'], tryHarder: true, maxNumberOfSymbols: 1 });
      for (const result of results) { assert.deepEqual(Buffer.from(result.bytes), f.ted, 'Rendered PDF417 must preserve the exact signed TED bytes: ' + format); decoded++; }
    }
    assert.equal(decoded, 1, 'Exactly one readable original stamp in ' + format);
    const text = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
    for (const expected of ['16608', 'NexoPOS', 'Timbre', 'Café & té', 'Res.']) assert(text.includes(expected), 'Missing issued content ' + expected);
    assert(!/lioren|no válido|sin validez|comprobante interno/i.test(text), 'Fiscal boleta must use NexoPOS without internal-receipt disclaimers');
    assert.equal(pages.length > 1, format === 'A4', 'Long A4 items must paginate; compact receipt must stay on one page');
    console.log('Verified ' + format + ': ' + pages.length + ' page(s), original TED decoded at 203 dpi');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
