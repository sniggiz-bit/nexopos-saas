'use strict';
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { WindowsWorker } = require('./worker.cjs');
const PORT = 18443;
const WEB = 'https://nexopos.cl';
const MAX = 4 * 1024 * 1024;
const worker = new WindowsWorker();
function windows(action, input) { return worker.request(action, input); }
function createHandler({ token, list = () => windows('list'), print = job => windows('print', job), port = PORT }) {
  const jobs = new Map(); let queued = 0; let queue = Promise.resolve();
  const own = 'https://localhost:' + port;
  const allowed = new Set([WEB, own]);
  const send = (res, status, value) => { if (res.destroyed) return; res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
  const sameToken = value => typeof value === 'string' && Buffer.byteLength(value) === Buffer.byteLength(token) && crypto.timingSafeEqual(Buffer.from(value), Buffer.from(token));
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (!['localhost:' + port, '127.0.0.1:' + port].includes(req.headers.host)) return send(res, 403, { error: 'Host no permitido.' });
    const origin = req.headers.origin;
    if (origin && !allowed.has(origin)) return send(res, 403, { error: 'Origen no permitido.' });
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Private-Network', 'true'); res.writeHead(204); return res.end();
    }
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" });
      return res.end(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Impresión NexoPOS</title><style>body{font:16px system-ui;max-width:580px;margin:8vh auto;padding:24px;background:#0b1018;color:#eaf3ff}select,button{padding:12px;width:100%;margin:12px 0;font:inherit}button{background:#00a1cb;color:white;border:0;border-radius:8px}p{line-height:1.6}a{color:#00cfff}</style><h1>Conectar impresora a NexoPOS</h1><p>Selecciona la impresora térmica instalada. El conector enviará los comprobantes y boletas a Windows sin abrir el diálogo de impresión.</p><select id="printers" aria-label="Impresora"></select><button id="pair" disabled>Vincular con NexoPOS</button><p id="message">Consultando impresoras...</p><script>const token=${JSON.stringify(token)};const select=document.getElementById('printers'),button=document.getElementById('pair'),message=document.getElementById('message');fetch('/printers',{headers:{Authorization:'Bearer '+token}}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{for(const p of data.printers){const o=document.createElement('option');o.value=p.name;o.textContent=p.name+(p.offline?' · sin conexión':'');o.disabled=p.offline;select.append(o)}const first=[...select.options].find(o=>!o.disabled);if(first){select.value=first.value;button.disabled=false;message.textContent='La conexión se guarda en el navegador que uses para NexoPOS.'}else message.textContent='Conecta una impresora térmica y actualiza esta página.'}).catch(()=>{message.textContent='No se pudo consultar las impresoras. Comprueba el servicio de impresión de Windows.'});button.onclick=()=>{location.href=${JSON.stringify(WEB + '/pos#nexopos-printer=')}+encodeURIComponent(JSON.stringify({token,printer:select.value}))}</script></html>`);
    }
    if (req.method === 'GET' && req.url === '/bootstrap') {
      if (origin !== WEB) return send(res, 403, { error: 'Origen no permitido.' });
      try { return send(res, 200, { ok: true, token, printers: await list() }); } catch (error) { return send(res, 503, { error: error.message }); }
    }
    if (!sameToken((req.headers.authorization || '').replace(/^Bearer /, ''))) return send(res, 401, { error: 'Vincula este navegador desde el conector local.' });
    if (req.method === 'GET' && req.url === '/printers') {
      try { return send(res, 200, { ok: true, version: '1.1.0', printers: await list() }); } catch (error) { return send(res, 503, { error: error.message }); }
    }
    if (req.method !== 'POST' || req.url !== '/jobs') return send(res, 404, { error: 'Ruta no disponible.' });
    if (String(req.headers['content-type']).split(';')[0] !== 'application/json') return send(res, 415, { error: 'Formato no válido.' });
    let bytes = 0; const chunks = [];
    try {
      for await (const part of req) { bytes += part.length; if (bytes > MAX * 1.4 + 4096) { send(res, 413, { error: 'Trabajo demasiado extenso.' }); return; } chunks.push(part); }
      const job = JSON.parse(Buffer.concat(chunks));
      const now = Date.now();
      for (const [id, entry] of jobs) if (entry.finished && now - entry.finished > 15 * 60 * 1000) jobs.delete(id);
      if (!/^[a-f0-9-]{36}$/i.test(job.id) || typeof job.printer !== 'string' || !job.printer || job.printer.length > 256 || typeof job.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(job.data)) return send(res, 400, { error: 'Trabajo no válido.' });
      const data = Buffer.from(job.data, 'base64');
      if (data.length < 2 || data.length > MAX || data[0] !== 27 || data[1] !== 64) return send(res, 400, { error: 'Datos de impresión no válidos.' });
      const digest = crypto.createHash('sha256').update(job.printer).update(data).digest('hex');
      let existing = jobs.get(job.id);
      if (existing && existing.digest !== digest) return send(res, 409, { error: 'El identificador ya pertenece a otro trabajo.' });
      if (!existing) {
        if (!Number.isFinite(job.createdAt) || Math.abs(now - job.createdAt) > 120000) return send(res, 400, { error: 'El trabajo expiró. Revisa el papel antes de reimprimir.' });
        if (queued >= 8 || jobs.size >= 1000) return send(res, 429, { error: 'Cola local ocupada. Revisa los trabajos pendientes antes de reimprimir.' });
        queued++;
        const pending = queue.then(() => print({ printer: job.printer, data: job.data })).then(value => ({ status: 200, value }), () => ({ status: 503, value: { error: 'No se confirmó el envío a Windows. Revisa el papel antes de reimprimir.' } })).finally(() => { queued--; });
        queue = pending;
        existing = { digest, pending, finished: 0 }; jobs.set(job.id, existing);
        void pending.then(() => { existing.finished = Date.now(); });
        // Outcomes outlive the submission window, so expired retries can never repeat a job.
      }
      const result = await existing.pending; return send(res, result.status, result.value);
    } catch { return send(res, 400, { error: 'No se pudo leer el trabajo de impresión.' }); }
  };
}
if (require.main === module) {
  if (process.platform !== 'win32') throw Error('Este conector requiere Windows.');
  const home = process.env.NEXOPOS_PRINT_HOME || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'NexoPOS', 'Print');
  const config = JSON.parse(fs.readFileSync(path.join(home, 'config.json'), 'utf8').replace(/^\uFEFF/, ''));
  if (!/^[a-f0-9]{64}$/.test(config.token)) throw Error('Vinculación local no válida.');
  const server = https.createServer({ pfx: fs.readFileSync(path.join(home, 'localhost.pfx')), passphrase: config.passphrase, minVersion: 'TLSv1.2' }, createHandler(config));
  server.requestTimeout = 45000; server.headersTimeout = 10000; server.maxConnections = 16;
  server.on('error', error => { worker.close(); console.error(error.code === 'EADDRINUSE' ? 'El conector ya está abierto.' : 'No se pudo iniciar el conector local.'); process.exitCode = 1; });
  void worker.ready().catch(() => console.error('El proceso local de impresión necesita reconectarse.'));
  process.once('exit', () => worker.close());
  server.listen(PORT, '127.0.0.1', () => console.log('Conector de impresión NexoPOS listo en https://localhost:' + PORT));
}
module.exports = { createHandler, windows };
