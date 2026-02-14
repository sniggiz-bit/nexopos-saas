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
    console.log('Upserting admin user...');
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: { id: 'tenant-1', name: 'Comercial Chile SpA', slug: 'comercial-chile-spa' },
    });
    const branch = await prisma.branch.upsert({
        where: { id: 'branch-1' },
        update: {},
        create: { id: 'branch-1', name: 'Casa Matriz Santiago', tenantId: tenant.id },
    });
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nexopos.cl' },
        update: {
            password: '1234',
            role: 'ADMIN',
        },
        create: {
            email: 'admin@nexopos.cl',
            name: 'Admin Principal',
            password: '1234',
            role: 'ADMIN',
            tenantId: tenant.id,
            branchId: branch.id,
        },
    });
    console.log('✅ Admin User Created/Updated:', admin.email);
    console.log('Password: 1234');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=create-admin-proper.js.map