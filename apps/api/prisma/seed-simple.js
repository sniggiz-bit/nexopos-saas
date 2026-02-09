// Seed con driver adapter para Prisma v7
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Crear pool de conexiones de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Crear adapter
const adapter = new PrismaPg(pool);

// Inicializar PrismaClient con el adapter
const prisma = new PrismaClient({ adapter });

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

    console.log('\n🎉 Seed completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
