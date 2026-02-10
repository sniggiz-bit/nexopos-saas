const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    try {
        const tenantId = 'tenant-1';
        const branchId = 'branch-1';
        console.log('--- DB Check ---');
        const products = await prisma.product.findMany({ where: { tenantId } });
        console.log('Products:', JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price })), null, 2));

        const inventory = await prisma.inventoryLevel.findMany({ where: { branchId } });
        console.log('Inventory for branch-1:', JSON.stringify(inventory.map(i => ({ productId: i.productId, quantity: i.quantity })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
check();
