"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Comercial Chile SpA',
        },
    });
    console.log('✅ Tenant creado:', tenant.name);
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
    console.log('✅ Producto creado:', product.name, `- $${product.price} CLP`);
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
});
//# sourceMappingURL=seed.js.map