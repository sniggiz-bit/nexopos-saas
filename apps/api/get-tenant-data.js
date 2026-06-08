require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        
        console.log('--- Distribution of Data by Tenant ---');
        
        // Tenant 1
        const p1 = await client.query('SELECT count(*) FROM "Product" WHERE "tenantId" = $1', ['tenant-1']);
        const s1 = await client.query('SELECT count(*) FROM "Sale" WHERE "tenantId" = $1', ['tenant-1']);
        const i1 = await client.query('SELECT count(*) FROM "InventoryLevel" i JOIN "Product" p ON i."productId" = p.id WHERE p."tenantId" = $1', ['tenant-1']);
        
        console.log('Tenant 1 (NexoPOS Oficial):');
        console.log(`- Products: ${p1.rows[0].count}`);
        console.log(`- Sales: ${s1.rows[0].count}`);
        console.log(`- Inventory items: ${i1.rows[0].count}`);

        // Tenant 2
        const p2 = await client.query('SELECT count(*) FROM "Product" WHERE "tenantId" = $1', ['78a08935-797b-4123-90ab-a4b32709cad7']);
        const s2 = await client.query('SELECT count(*) FROM "Sale" WHERE "tenantId" = $1', ['78a08935-797b-4123-90ab-a4b32709cad7']);
        const i2 = await client.query('SELECT count(*) FROM "InventoryLevel" i JOIN "Product" p ON i."productId" = p.id WHERE p."tenantId" = $1', ['78a08935-797b-4123-90ab-a4b32709cad7']);

        console.log('Tenant 2 (Supermercado Demo):');
        console.log(`- Products: ${p2.rows[0].count}`);
        console.log(`- Sales: ${s2.rows[0].count}`);
        console.log(`- Inventory items: ${i2.rows[0].count}`);

    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
