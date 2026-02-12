
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        const query = `
            INSERT INTO "Customer" ("id", "name", "rut", "email", "phone", "address", "comuna", "tenantId", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *;
        `;
        // Ensure RUT is unique
        const rut = '99.999.999-' + Math.floor(Math.random() * 10);
        const values = ['cust-' + Date.now(), 'Test SQL Customer', rut, 'sql@test.com', '123123', 'SQL Address', 'SQL Comuna', 'tenant-1'];

        const res = await client.query(query, values);
        console.log('Customer inserted:', res.rows[0]);
    } catch (err) {
        console.error('Error inserting customer:', err);
    } finally {
        await client.end();
    }
}

run();
