"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Iniciando carga de productos chilenos...');
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Minimarket Don Pepe',
        },
    });
    const branch = await prisma.branch.upsert({
        where: { id: 'branch-1' },
        update: {},
        create: {
            id: 'branch-1',
            name: 'Sucursal Central',
            tenantId: tenant.id,
        },
    });
    const categories = [
        { name: 'Bebidas' },
        { name: 'Despensa' },
        { name: 'Snacks' },
        { name: 'Lácteos' },
    ];
    const categoryMap = {};
    for (const cat of categories) {
        const createdCat = await prisma.category.upsert({
            where: { name_tenantId: { name: cat.name, tenantId: tenant.id } },
            update: {},
            create: { name: cat.name, tenantId: tenant.id },
        });
        categoryMap[cat.name] = createdCat.id;
    }
    const brands = [
        { name: 'CCU' },
        { name: 'Tucapel' },
        { name: 'Evercrisp' },
        { name: 'Belmont' },
        { name: 'Nestlé' },
        { name: 'Colun' },
        { name: 'Lucchetti' },
        { name: 'Soprole' },
    ];
    const brandMap = {};
    for (const brand of brands) {
        const createdBrand = await prisma.brand.upsert({
            where: { name_tenantId: { name: brand.name, tenantId: tenant.id } },
            update: {},
            create: { name: brand.name, tenantId: tenant.id },
        });
        brandMap[brand.name] = createdBrand.id;
    }
    const productsData = [
        {
            name: 'Bebida Bilz 1.5L',
            brand: 'CCU',
            category: 'Bebidas',
            cost: 950,
            price: 1550,
            sku: 'BEB-BIL-15',
            barcode: '7801234567891',
            stock: 48,
        },
        {
            name: 'Arroz Tucapel Granulado 1kg',
            brand: 'Tucapel',
            category: 'Despensa',
            cost: 1100,
            price: 1690,
            sku: 'DES-ARR-TUC-1',
            barcode: '7809876543210',
            stock: 60,
        },
        {
            name: 'Ramitas Evercrisp Queso 150g',
            brand: 'Evercrisp',
            category: 'Snacks',
            cost: 850,
            price: 1350,
            sku: 'SNA-RAM-EVE-150',
            barcode: '7801112223334',
            stock: 40,
        },
        {
            name: 'Aceite Belmont Maravilla 1L',
            brand: 'Belmont',
            category: 'Despensa',
            cost: 1550,
            price: 2190,
            sku: 'DES-ACE-BEL-1',
            barcode: '7804445556667',
            stock: 30,
        },
        {
            name: 'Super 8 Original Nestlé',
            brand: 'Nestlé',
            category: 'Snacks',
            cost: 280,
            price: 500,
            sku: 'SNA-SUP8-ORI',
            barcode: '7807778889990',
            stock: 120,
        },
        {
            name: 'Leche Colun Entera 1L',
            brand: 'Colun',
            category: 'Lácteos',
            cost: 780,
            price: 1150,
            sku: 'LAC-LEC-COL-1',
            barcode: '7800001112223',
            stock: 24,
        },
        {
            name: 'Papas Fritas Lay\'s 200g',
            brand: 'Evercrisp',
            category: 'Snacks',
            cost: 1200,
            price: 1890,
            sku: 'SNA-PAP-LAY-200',
            barcode: '7803334445556',
            stock: 35,
        },
        {
            name: 'Fideos Lucchetti Espiral 400g',
            brand: 'Lucchetti',
            category: 'Despensa',
            cost: 650,
            price: 990,
            sku: 'DES-FID-LUC-400',
            barcode: '7806667778889',
            stock: 50,
        },
        {
            name: 'Bebida Pap 1.5L',
            brand: 'CCU',
            category: 'Bebidas',
            cost: 950,
            price: 1550,
            sku: 'BEB-PAP-15',
            barcode: '7801110009998',
            stock: 48,
        },
        {
            name: 'Yogurt Soprole Batido Frutilla 120g',
            brand: 'Soprole',
            category: 'Lácteos',
            cost: 320,
            price: 350,
            sku: 'LAC-YOG-SOP-120',
            barcode: '7802223334445',
            stock: 48,
        },
    ];
    for (const p of productsData) {
        const product = await prisma.product.upsert({
            where: { barcode_tenantId: { barcode: p.barcode, tenantId: tenant.id } },
            update: {
                price: p.price,
                costPrice: p.cost,
            },
            create: {
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                price: p.price,
                costPrice: p.cost,
                tenantId: tenant.id,
                categoryId: categoryMap[p.category],
                brandId: brandMap[p.brand],
                unitType: client_1.UnitType.UNIT,
                isActive: true,
            },
        });
        console.log(`✅ Producto procesado: ${product.name}`);
        const inventory = await prisma.inventoryLevel.upsert({
            where: {
                productId_branchId: {
                    productId: product.id,
                    branchId: branch.id,
                },
            },
            update: {
                quantity: p.stock,
            },
            create: {
                productId: product.id,
                branchId: branch.id,
                quantity: p.stock,
            },
        });
        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                branchId: branch.id,
                quantity: p.stock,
                type: client_1.MovementType.INITIAL,
                reference: 'Carga Inicial Seed Realista',
                balance: p.stock,
            },
        });
        console.log(`   📦 Stock: ${inventory.quantity} unidades en ${branch.name} y Kardex actualizado.`);
    }
    console.log('\n🎉 ¡Poblamiento de productos completado exitosamente!');
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
//# sourceMappingURL=seed-products.js.map