"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
async function main() {
    console.log('🔍 Starting Database Diagnostic (with PG Adapter)...');
    console.log(`Checking Env: DATABASE_URL is ${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        console.log('Testing Tenant Access...');
        const tenants = await prisma.tenant.findMany();
        console.log(`✅ Tenants found: ${tenants.length}`);
        if (tenants.length > 0) {
            console.log(`- First Tenant: ${tenants[0].name} (${tenants[0].id})`);
        }
        console.log('\nTesting Product Access...');
        const products = await prisma.product.findMany({
            include: { inventory: true },
            take: 5
        });
        console.log(`✅ Products found: ${products.length}`);
        products.forEach(p => {
            console.log(`- ${p.name} (Inv: ${p.inventory.length})`);
        });
        const inventoryCount = await prisma.inventoryLevel.count();
        console.log(`\n✅ Total InventoryLevel records: ${inventoryCount}`);
    }
    catch (error) {
        console.error('❌ DATABASE ERROR:', error);
    }
    finally {
        await prisma.$disconnect();
        console.log('🏁 Diagnostic finished.');
    }
}
main().catch(console.error);
//# sourceMappingURL=diagnose-db.js.map