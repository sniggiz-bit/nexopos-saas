
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed-roles...');

    // 1. Ensure Tenant exists
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Comercial Chile SpA',
            slug: 'comercial-chile-spa',
        },
    });
    console.log('✅ Tenant:', tenant.name);

    // 2. Ensure Branch exists
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

    // 3. Upsert Cashier User
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
