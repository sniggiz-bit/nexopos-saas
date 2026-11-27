const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const dist = path.resolve(process.argv[2] || path.join(__dirname, 'dist'));
const user = { id: 'operator', name: 'Caja de prueba', tenantId: 'offline-test', branchId: 'branch', role: 'TENANT_ADMIN' };
const product = { id: 'a', name: 'Avena de prueba', sku: 'AVENA', barcode: '1234', unitType: 'UNIT', price: 800, minStock: 1, stock: 10, isActive: true, tenantId: user.tenantId };
const shift = { id: 'test-shift', status: 'OPEN', branchId: user.branchId, startTime: new Date().toISOString(), initialAmount: 0 };
const requests = [];
const committed = new Map();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const json = (body, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(body));
    };
    if (url.pathname === '/api/auth/me') return json({ user });
    if (url.pathname === '/api/shifts/current/branch') return json(shift);
    if (url.pathname === '/api/dte-config/sales-mode') return json({ mode: 'internal' });
    if (url.pathname === '/api/branches') return json([{ id: 'branch', name: 'Sucursal de prueba' }]);
    if (url.pathname === '/api/products') {
        return json({ data: [product], total: 1, page: 1, limit: 200, totalPages: 1 });
    }
    if (req.method === 'POST' && url.pathname === '/api/sales') {
        let source = '';
        for await (const chunk of req) source += chunk;
        const payload = JSON.parse(source);
        const id = payload.offline?.id;
        requests.push(payload);
        if (!committed.has(id)) {
            committed.set(id, { id: 'saved-' + id, offlineId: id, total: payload.payments[0].amount });
            product.stock -= payload.items[0].quantity;
            req.socket.destroy();
            return;
        }
        return json(committed.get(id), 201);
    }
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return json([]);
    const filename = path.resolve(dist, path.extname(url.pathname) ? '.' + url.pathname : 'index.html');
    if (!filename.startsWith(dist + path.sep)) return json({}, 404);
    const buffer = await fs.readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' });
    res.end(buffer);
}

(async () => {
    const server = http.createServer((req, res) => void handle(req, res).catch(() => {
        if (!res.headersSent) res.writeHead(404);
        res.end();
    }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch(process.env.NEXOPOS_TEST_BROWSER ? { channel: process.env.NEXOPOS_TEST_BROWSER } : {});
        const context = await browser.newContext({ serviceWorkers: 'allow' });
        await context.addInitScript(data => {
            localStorage.setItem('token', 'isolated-test-token');
            localStorage.setItem('user', JSON.stringify(data));
        }, user);
        const page = await context.newPage();
        page.on('pageerror', error => console.error('Browser error:', error.message));
        await page.goto('http://127.0.0.1:' + server.address().port + '/pos');
        await page.getByText('Caja preparada para cortes de conexión').waitFor({ timeout: 60000 }).catch(async error => {
            throw new Error('Offline preparation did not finish: ' + (await page.locator('body').innerText()).slice(0, 500), { cause: error });
        });
        await page.waitForFunction(() => !!navigator.serviceWorker.controller);
        const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
        assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
        for (const icon of manifest.icons) {
            const png = await fs.readFile(path.join(dist, icon.src));
            assert.equal(png.readUInt32BE(16) + 'x' + png.readUInt32BE(20), icon.sizes);
        }

        await context.setOffline(true);
        await page.getByText('Sin conexión · catálogo guardado').waitFor();
        await page.getByPlaceholder(/Buscar producto/).fill('avena');
        await page.getByRole('heading', { name: product.name }).click();
        await page.keyboard.press('F12');
        await page.getByRole('heading', { name: 'Cobro sin conexión' }).waitFor();
        await page.getByRole('button', { name: 'Guardar venta' }).click();
        await page.getByText(/Ventas pendientes \(1\)/).waitFor();
        assert.equal(requests.length, 0);

        await page.reload();
        await page.getByText('Sin conexión · catálogo guardado').waitFor();
        await page.getByRole('heading', { name: product.name }).waitFor();
        await page.getByText(/Ventas pendientes \(1\)/).waitFor();
        assert.equal(requests.length, 0);
        console.log('PASS: the installed app reloads offline and keeps the catalog and recorded cash payment');

        await context.setOffline(false);
        await page.getByText(/Ventas pendientes \(1\)/).waitFor({ state: 'hidden', timeout: 70000 }).catch(async error => {
            throw new Error('Replay did not drain the queue. Requests: ' + requests.length + ', committed: ' + committed.size +
                ', browser online: ' + await page.evaluate(() => navigator.onLine), { cause: error });
        });
        assert.equal(requests.length, 2);
        assert.equal(committed.size, 1);
        assert.deepEqual(requests[0], requests[1]);
        assert.equal(requests[0].offline.shiftId, shift.id);
        assert.deepEqual(requests[0].payments, [{ paymentMethod: 'EFECTIVO', amount: 800 }]);
        assert.equal(product.stock, 9);
        console.log('PASS: reconnect retries a lost response with the same sale ID and clears the queue on acknowledgment');
    } finally {
        if (browser) await browser.close();
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
