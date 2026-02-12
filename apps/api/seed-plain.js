
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed (JS Plain)...');

    // 1. Crear Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Comercial Chile SpA',
        },
    });
    console.log('✅ Tenant:', tenant.name);

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
    console.log('✅ Branch:', branch.name);

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
    console.log('✅ User:', user.name);

    // 4. Crear Product
    const product = await prisma.product.upsert({
        where: { id: 'prod-1' },
        update: {},
        create: {
            id: 'prod-1',
            name: 'Bebida Fantasía 350ml',
            sku: 'BEB-350',
            price: 1500,
            tenantId: tenant.id,
        },
    });
    console.log('✅ Product:', product.name);

    // 5. Inventory
    await prisma.inventoryLevel.upsert({
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
    console.log('✅ Inventory 100');

    // 6. DteConfig
    await prisma.dteConfig.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            liorenToken: 'TEST_TOKEN',
            dteResolution: '123456',
            resolutionDate: new Date(),
        },
    });
    console.log('✅ DteConfig');

    console.log('🎉 Seed completo!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
