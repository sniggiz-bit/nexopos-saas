import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('nexopos2026', 10);

    // 1. Obtener el tenant por defecto (tenant-1) o crear uno
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'NexoPOS Oficial',
            slug: 'nexopos-oficial',
        },
    });

    // 2. Obtener la sucursal por defecto (branch-1) o crear una
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

    // A. Super Admin
    await prisma.user.upsert({
        where: { email: 'admin@nexopos.cl' },
        update: { password: hashedPassword, role: UserRole.SUPER_ADMIN },
        create: {
            email: 'admin@nexopos.cl',
            name: 'Super Admin Nexo',
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            tenantId: tenant.id,
        },
    });
    console.log('✅ admin@nexopos.cl listo');

    // B. Admin de Local
    await prisma.user.upsert({
        where: { email: 'gestion@nexopos.cl' },
        update: { password: hashedPassword, role: UserRole.ADMIN },
        create: {
            email: 'gestion@nexopos.cl',
            name: 'Administrador Nexo',
            password: hashedPassword,
            role: UserRole.ADMIN,
            tenantId: tenant.id,
            branchId: branch.id,
        },
    });
    console.log('✅ gestion@nexopos.cl listo');

    // C. Cajero
    await prisma.user.upsert({
        where: { email: 'ventas@nexopos.cl' },
        update: { password: hashedPassword, role: UserRole.CASHIER },
        create: {
            email: 'ventas@nexopos.cl',
            name: 'Cajero Nexo',
            password: hashedPassword,
            role: UserRole.CASHIER,
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
