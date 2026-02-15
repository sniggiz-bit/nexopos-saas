"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
async function main() {
    console.log('🔍 Checking Tenant Settings...');
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                storeSlug: true,
                storeSettings: true,
            }
        });
        console.log(JSON.stringify(tenants, null, 2));
    }
    catch (error) {
        console.error('❌ DATABASE ERROR:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=check-tenant-full.js.map