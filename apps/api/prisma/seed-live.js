// Seed para tenant real (detecta IDs dinámicamente)
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/nexopos?schema=public',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    console.log('🌱 Detectando tenant activo...');

    const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!tenant) throw new Error('No hay tenants. Crea uno primero con register-tenant.');
    console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

    const branch = await prisma.branch.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'asc' },
    });
    if (!branch) throw new Error('No hay sucursales para este tenant.');
    console.log(`✅ Sucursal: ${branch.name} (${branch.id})`);

    const user = await prisma.user.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'asc' },
    });
    if (!user) throw new Error('No hay usuarios para este tenant.');
    console.log(`✅ Usuario: ${user.email}`);

    // ── CATEGORÍAS ──────────────────────────────────────────────────────────
    const catNames = ['Abarrotes', 'Bebidas', 'Lácteos', 'Snacks', 'Limpieza'];
    const cats = {};
    for (const name of catNames) {
        const c = await prisma.category.upsert({
            where: { name_tenantId: { name, tenantId: tenant.id } },
            update: {},
            create: { name, tenantId: tenant.id },
        });
        cats[name] = c.id;
    }
    console.log(`✅ ${catNames.length} categorías`);

    // ── MARCAS ───────────────────────────────────────────────────────────────
    const brandNames = ['Carozzi', 'CCU', 'Soprole', 'Evercrisp', 'Genérico'];
    const brands = {};
    for (const name of brandNames) {
        const b = await prisma.brand.upsert({
            where: { name_tenantId: { name, tenantId: tenant.id } },
            update: {},
            create: { name, tenantId: tenant.id },
        });
        brands[name] = b.id;
    }
    console.log(`✅ ${brandNames.length} marcas`);

    // ── PRODUCTOS ────────────────────────────────────────────────────────────
    const productDefs = [
        { name: 'Arroz Carozzi 1kg', sku: 'ARR-001', price: 1490, cost: 900, stock: 50, min: 5, cat: 'Abarrotes', brand: 'Carozzi' },
        { name: 'Fideos Carozzi Spaghetti 400g', sku: 'FID-001', price: 890, cost: 550, stock: 80, min: 10, cat: 'Abarrotes', brand: 'Carozzi' },
        { name: 'Coca-Cola 1.5L', sku: 'BEB-001', price: 1590, cost: 900, stock: 60, min: 12, cat: 'Bebidas', brand: 'CCU' },
        { name: 'Cerveza Escudo 355ml', sku: 'BEB-002', price: 890, cost: 500, stock: 120, min: 24, cat: 'Bebidas', brand: 'CCU' },
        { name: 'Leche Soprole 1L', sku: 'LAC-001', price: 1190, cost: 700, stock: 40, min: 8, cat: 'Lácteos', brand: 'Soprole' },
        { name: 'Yogurt Soprole Frutilla 1kg', sku: 'LAC-002', price: 2490, cost: 1500, stock: 25, min: 5, cat: 'Lácteos', brand: 'Soprole' },
        { name: 'Papas Fritas Evercrisp 150g', sku: 'SNA-001', price: 990, cost: 550, stock: 70, min: 10, cat: 'Snacks', brand: 'Evercrisp' },
        { name: 'Detergente Bold 1kg', sku: 'LIM-001', price: 3490, cost: 2000, stock: 30, min: 5, cat: 'Limpieza', brand: 'Genérico' },
        { name: 'Cloro 1L', sku: 'LIM-002', price: 1290, cost: 700, stock: 45, min: 8, cat: 'Limpieza', brand: 'Genérico' },
        { name: 'Pan Molde Ideal 500g', sku: 'ABR-002', price: 1690, cost: 1100, stock: 20, min: 4, cat: 'Abarrotes', brand: 'Genérico' },
    ];

    const products = [];
    for (const p of productDefs) {
        let prod = await prisma.product.findFirst({
            where: { sku: p.sku, tenantId: tenant.id },
        });
        if (!prod) {
            prod = await prisma.product.create({
                data: {
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    costPrice: p.cost,
                    minStock: p.min,
                    tenantId: tenant.id,
                    categoryId: cats[p.cat],
                    brandId: brands[p.brand],
                },
            });
        }
        products.push(prod);
    }
    console.log(`✅ ${products.length} productos`);

    // ── VENTAS DE HOY ────────────────────────────────────────────────────────
    const now = new Date();
    const salesData = [
        {
            items: [{ product: products[0], qty: 2 }, { product: products[4], qty: 1 }],
            payment: 'EFECTIVO',
            minsAgo: 20,
        },
        {
            items: [{ product: products[2], qty: 3 }, { product: products[6], qty: 2 }],
            payment: 'DEBITO',
            minsAgo: 55,
        },
        {
            items: [{ product: products[1], qty: 1 }, { product: products[5], qty: 1 }, { product: products[9], qty: 2 }],
            payment: 'TRANSFERENCIA',
            minsAgo: 90,
        },
        {
            items: [{ product: products[3], qty: 6 }, { product: products[7], qty: 1 }],
            payment: 'EFECTIVO',
            minsAgo: 130,
        },
        {
            items: [{ product: products[8], qty: 2 }, { product: products[0], qty: 3 }],
            payment: 'CREDITO',
            minsAgo: 180,
        },
    ];

    let salesCreated = 0;
    for (const s of salesData) {
        const total = s.items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
        const createdAt = new Date(now.getTime() - s.minsAgo * 60 * 1000);

        await prisma.sale.create({
            data: {
                tenantId: tenant.id,
                branchId: branch.id,
                userId: user.id,
                total,
                status: 'COMPLETED',
                createdAt,
                updatedAt: createdAt,
                items: {
                    create: s.items.map(i => ({
                        productId: i.product.id,
                        quantity: i.qty,
                        price: i.product.price,
                    })),
                },
                payments: {
                    create: [{
                        paymentMethod: s.payment,
                        amount: total,
                    }],
                },
            },
        });
        salesCreated++;
        console.log(`✅ Venta $${total.toLocaleString('es-CL')} - ${s.payment} (hace ${s.minsAgo}min)`);
    }

    console.log(`\n🎉 Seed completo: ${products.length} productos, ${salesCreated} ventas de hoy`);
    const totalHoy = salesData.reduce((sum, s) =>
        sum + s.items.reduce((t, i) => t + i.product.price * i.qty, 0), 0);
    console.log(`💰 Total ventas hoy: $${totalHoy.toLocaleString('es-CL')}`);
}

main()
    .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect().then(() => pool.end()));
