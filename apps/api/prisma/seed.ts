import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // 1. Crear Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Comercial Chile SpA',
        },
    });
    console.log('✅ Tenant creado:', tenant.name);

    // 2. Crear Branch
    const branch = await prisma.branch.upsert({
        where: { id: 'branch-1' },
        update: {},
        create: {
            id: 'branch-1',
            name: 'Casa Matriz Santiago',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Sucursal creada:', branch.name);

    // 3. Crear User
    const user = await prisma.user.upsert({
        where: { email: 'cajero@demo.cl' },
        update: {},
        create: {
            email: 'cajero@demo.cl',
            name: 'Cajero 1',
            tenantId: tenant.id,
            branchId: branch.id,
        },
    });
    console.log('✅ Usuario creado:', user.name);

    // 4. Crear Product
    const product = await prisma.product.upsert({
        where: { id: 'prod-1' },
        update: {},
        create: {
            id: 'prod-1',
            name: 'Bebida Fantasía 350ml',
            sku: 'BEB-350',
            price: 1500, // CLP
            tenantId: tenant.id,
        },
    });
    console.log('✅ Producto creado:', product.name, `- $${product.price} CLP`);

    // 5. Crear InventoryLevel
    const inventory = await prisma.inventoryLevel.upsert({
        where: {
            productId_branchId: {
                productId: product.id,
                branchId: branch.id,
            },
        },
        update: {},
        create: {
            productId: product.id,
            branchId: branch.id,
            quantity: 100,
        },
    });
    console.log('✅ Inventario creado:', inventory.quantity, 'unidades');

    // 6. Crear DteConfig para el Tenant
    const dteConfig = await prisma.dteConfig.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            liorenToken: 'TEST_TOKEN_LIOREN_2026', // Placeholder token for testing
            dteResolution: '123456',
            resolutionDate: new Date(),
        },
    });
    console.log('✅ Configuración DTE creada para el tenant');

    // 7. Crear Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@nexopos-saas.cl' },
        update: {},
        create: {
            email: 'admin@nexopos-saas.cl',
            name: 'Super Admin',
            password: 'supersecretpassword', // Will be hashed by AuthService or manually here if needed. 
            // In seed we might want to hash it if the app expects it, but validation handles plain text fallback.
            // Let's rely on fallback or just set a role.
            role: 'SUPER_ADMIN',
            tenantId: tenant.id, // Super Admin needs a tenant? Schema says yes. We can assign to the default one or a specific admin tenant.
            // Using tenant.id for now.
        },
    });
    console.log('✅ Super Admin creado:', superAdmin.email);

    console.log('\n🎉 Seed completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
