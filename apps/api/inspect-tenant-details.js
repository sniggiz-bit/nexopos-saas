require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        const tenantId = '78a08935-797b-4123-90ab-a4b32709cad7';

        console.log('--- INSPECTING TENANT 2 DETAILS ---');

        // Branches of this tenant
        const branches = await client.query('SELECT * FROM "Branch" WHERE "tenantId" = $1', [tenantId]);
        console.log('Branches:', branches.rows);

        // Users of this tenant
        const users = await client.query('SELECT id, email, name, "tenantId", "branchId", role FROM "User" WHERE "tenantId" = $1', [tenantId]);
        console.log('Users:', users.rows);

        // Products of this tenant
        const products = await client.query('SELECT id, name, sku, price FROM "Product" WHERE "tenantId" = $1 LIMIT 5', [tenantId]);
        console.log('Sample Products:', products.rows);

        // Inventory levels of this tenant's products
        const inventory = await client.query(
            `SELECT i."productId", i."branchId", i.quantity, p.name as "productName", b.name as "branchName" 
             FROM "InventoryLevel" i 
             JOIN "Product" p ON i."productId" = p.id 
             JOIN "Branch" b ON i."branchId" = b.id
             WHERE p."tenantId" = $1`, 
            [tenantId]
        );
        console.log('Inventory Levels:', inventory.rows);

        // Sales of this tenant
        const sales = await client.query('SELECT id, total, "branchId", "userId", status, "createdAt" FROM "Sale" WHERE "tenantId" = $1', [tenantId]);
        console.log('Sales:', sales.rows);

    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
