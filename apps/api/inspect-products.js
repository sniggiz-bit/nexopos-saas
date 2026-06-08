require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        
        console.log('--- PRODUCTS DETAILS ---');
        const products = await client.query('SELECT id, name, "tenantId" FROM "Product"');
        console.log('All Products:', products.rows);

        console.log('--- BRANCHES DETAILS ---');
        const branches = await client.query('SELECT id, name, "tenantId" FROM "Branch"');
        console.log('All Branches:', branches.rows);

        console.log('--- USERS DETAILS ---');
        const users = await client.query('SELECT id, email, name, "tenantId", "branchId" FROM "User"');
        console.log('All Users:', users.rows);
    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
