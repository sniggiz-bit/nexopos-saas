"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Checking Tenants...');
    const tenants = await prisma.tenant.findMany({
        include: {
            plan: true,
            users: true
        }
    });
    console.log(`Found ${tenants.length} tenants.`);
    tenants.forEach(t => {
        console.log(`- ${t.name} (Status: ${t.status}, Plan: ${t.plan?.name}, Users: ${t.users.length})`);
    });
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=verify-tenants.js.map