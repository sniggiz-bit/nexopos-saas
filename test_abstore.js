const axios = require('axios');

async function test(url) {
    console.log(`Testing: ${url}...`);
    try {
        const response = await axios.get(url, { timeout: 10000 });
        console.log('SUCCESS:', response.status, response.data);
    } catch (error) {
        console.log('FAIL:', error.message, error.response ? error.response.status : '', error.response ? error.response.data : '');
    }
}

async function run() {
    await test('https://api.abstore.cl/api/rut/77311726-8');
    await test('https://api.abstore.cl/sii/rut/77311726-8');
    await test('https://api.abstore.cl/api/rut/773117268');
    await test('https://api.abstore.cl/sii/rut/773117268');
}

run();
