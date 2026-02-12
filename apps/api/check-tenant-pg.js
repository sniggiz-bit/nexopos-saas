
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM "Tenant" WHERE id = $1', ['tenant-1']);
        console.log('Tenant:', res.rows[0]);
    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
