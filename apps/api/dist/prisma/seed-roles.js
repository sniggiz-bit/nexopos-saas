"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Starting seed-roles...');
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Comercial Chile SpA',
        },
    });
    console.log('✅ Tenant:', tenant.name);
    const branch = await prisma.branch.upsert({
        where: { id: 'branch-1' },
        update: {},
        create: {
            id: 'branch-1',
            name: 'Casa Matriz Santiago',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Branch:', branch.name);
    const cashierEmail = 'cajero@nexopos.cl';
    const cashier = await prisma.user.upsert({
        where: { email: cashierEmail },
        update: {
            password: '1234',
            role: 'CASHIER',
            branchId: branch.id,
        },
        create: {
            email: cashierEmail,
            password: '1234',
            name: 'Cajero Principal',
            role: 'CASHIER',
            tenantId: tenant.id,
            branchId: branch.id,
        },
    });
    console.log('✅ Cashier User:', cashier.email, 'Role:', cashier.role);
    console.log('🎉 Seed roles complete!');
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed-roles.js.map