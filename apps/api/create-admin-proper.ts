
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Upserting admin user...');

    // Ensure tenant and branch exist first (just in case)
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
            password: '1234', // Plain text, system will auto-hash on login
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
