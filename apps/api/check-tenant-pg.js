require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        
        const users = await client.query('SELECT id, email, name, "tenantId", "branchId", role FROM "User"');
        const tenants = await client.query('SELECT id, name, slug FROM "Tenant"');
        const branches = await client.query('SELECT id, name, "tenantId" FROM "Branch"');
        const productsCount = await client.query('SELECT count(*) FROM "Product"');
        const salesCount = await client.query('SELECT count(*) FROM "Sale"');
        const inventoryCount = await client.query('SELECT count(*) FROM "InventoryLevel"');

        console.log('--- DB DIAGNOSIS ---');
        console.log('Tenants:', tenants.rows);
        console.log('Branches:', branches.rows);
        console.log('Users:', users.rows);
        console.log('Products count:', productsCount.rows[0].count);
        console.log('Sales count:', salesCount.rows[0].count);
        console.log('Inventory count:', inventoryCount.rows[0].count);
    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
