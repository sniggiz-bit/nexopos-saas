const http = require('http');

function post(url, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: u.port || 80,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function get(url, token) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: u.port || 80,
            path: u.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    try {
        console.log('--- Logging in to Local API ---');
        const loginRes = await post('http://localhost:4000/api/auth/login', JSON.stringify({
            email: 'admin@demo.cl',
            password: 'admin123'
        }));
        
        console.log('Login Response Status:', loginRes.statusCode);
        if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
            console.error('Login failed:', loginRes.body);
            return;
        }

        const token = loginRes.body.access_token;
        console.log('Login successful! User info:', loginRes.body.user);

        console.log('\n--- Fetching Dashboard Stats ---');
        const statsRes = await get('http://localhost:4000/api/dashboard/stats?branchId=branch-providencia', token);
        console.log('Stats Status:', statsRes.statusCode);
        console.log('Stats Body:', statsRes.body);

        console.log('\n--- Fetching Products ---');
        const productsRes = await get('http://localhost:4000/api/products?branchId=branch-providencia', token);
        console.log('Products Status:', productsRes.statusCode);
        console.log('Total Products:', productsRes.body.total);
        console.log('Products Sample:', productsRes.body.data.slice(0, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
