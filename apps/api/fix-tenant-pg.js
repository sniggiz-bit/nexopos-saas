
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        const query = `
            INSERT INTO "Tenant" ("id", "name", "createdAt", "updatedAt") 
            VALUES ($1, $2, NOW(), NOW()) 
            ON CONFLICT ("id") DO NOTHING
            RETURNING *;
        `;
        const values = ['tenant-1', 'Comercial Chile SpA'];

        const res = await client.query(query, values);
        console.log('Tenant upsert result:', res.rows[0] || 'Already exists');

        // Also ensure Branch exists as it's often needed
        const branchQuery = `
            INSERT INTO "Branch" ("id", "name", "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT ("id") DO NOTHING
            RETURNING *;
        `;
        const branchValues = ['branch-1', 'Casa Matriz Santiago', 'tenant-1'];
        const branchRes = await client.query(branchQuery, branchValues);
        console.log('Branch upsert result:', branchRes.rows[0] || 'Already exists');

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

run();
