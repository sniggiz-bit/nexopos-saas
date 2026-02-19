const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('nexopos2026', 10);

    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'NexoPOS Oficial',
            slug: 'nexopos-oficial',
        },
    });

    const branch = await prisma.branch.upsert({
        where: { id: 'branch-1' },
        update: {},
        create: {
            id: 'branch-1',
            name: 'Casa Matriz',
            tenantId: tenant.id,
        },
    });

    console.log('👥 Creando usuarios con dominio nexopos.cl...');

    await prisma.user.upsert({
        where: { email: 'admin@nexopos.cl' },
        update: { password: hashedPassword, role: 'SUPER_ADMIN' },
        create: {
            email: 'admin@nexopos.cl',
            name: 'Super Admin Nexo',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
        },
    });
    console.log('✅ admin@nexopos.cl listo');

    await prisma.user.upsert({
        where: { email: 'gestion@nexopos.cl' },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: {
            email: 'gestion@nexopos.cl',
            name: 'Administrador Nexo',
            password: hashedPassword,
            role: 'ADMIN',
            tenantId: tenant.id,
            branchId: branch.id,
        },
    });
    console.log('✅ gestion@nexopos.cl listo');

    await prisma.user.upsert({
        where: { email: 'ventas@nexopos.cl' },
        update: { password: hashedPassword, role: 'CASHIER' },
        create: {
            email: 'ventas@nexopos.cl',
            name: 'Cajero Nexo',
            password: hashedPassword,
            role: 'CASHIER',
            tenantId: tenant.id,
            branchId: branch.id,
        },
    });
    console.log('✅ ventas@nexopos.cl listo');

    console.log('🚀 ¡Proceso completado!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
