import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/nexopos?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// ID del tenant existente (creado por seed.ts base)
const TENANT_ID = 'tenant-1';
// ID de la sucursal principal existente (creada por seed.ts base)
const BRANCH_MAIN_ID = 'branch-1';
const BRANCH_PROVIDENCIA_ID = 'branch-providencia';

async function main() {
    console.log('🌱 Iniciando seed de demostración con datos chilenos...\n');

    // ── 1. SUCURSAL ADICIONAL ─────────────────────────────────────────────
    const branchProvidencia = await prisma.branch.upsert({
        where: { id: BRANCH_PROVIDENCIA_ID },
        update: {},
        create: {
            id: BRANCH_PROVIDENCIA_ID,
            name: 'Sucursal Providencia',
            address: 'Av. Providencia 1234, Santiago',
            tenantId: TENANT_ID,
        },
    });
    console.log('✅ Sucursal:', branchProvidencia.name);

    // ── 2. CATEGORÍAS ─────────────────────────────────────────────────────
    const categoryNames = ['Abarrotes', 'Bebidas', 'Lácteos', 'Limpieza', 'Snacks'];
    const categories: Record<string, string> = {};

    for (const name of categoryNames) {
        const cat = await prisma.category.upsert({
            where: { name_tenantId: { name, tenantId: TENANT_ID } },
            update: {},
            create: { name, tenantId: TENANT_ID },
        });
        categories[name] = cat.id;
        console.log('✅ Categoría:', cat.name);
    }

    // ── 3. MARCAS ─────────────────────────────────────────────────────────
    const brandNames = ['Carozzi', 'CCU', 'Soprole', 'Virutex', 'Evercrisp'];
    const brands: Record<string, string> = {};

    for (const name of brandNames) {
        const brand = await prisma.brand.upsert({
            where: { name_tenantId: { name, tenantId: TENANT_ID } },
            update: {},
            create: { name, tenantId: TENANT_ID },
        });
        brands[name] = brand.id;
        console.log('✅ Marca:', brand.name);
    }

    // ── 4. PRODUCTOS ──────────────────────────────────────────────────────
    const productsData = [
        { id: 'prod-demo-1001', name: 'Fideos Espagueti 5', sku: '1001', price: 1200, brand: 'Carozzi', category: 'Abarrotes' },
        { id: 'prod-demo-1002', name: 'Salsa de Tomates Italiana', sku: '1002', price: 950, brand: 'Carozzi', category: 'Abarrotes' },
        { id: 'prod-demo-1003', name: 'Bebida Coca-Cola Original 2.5L', sku: '1003', price: 2500, brand: 'CCU', category: 'Bebidas' },
        { id: 'prod-demo-1004', name: 'Cerveza Cristal Lata 470cc', sku: '1004', price: 1100, brand: 'CCU', category: 'Bebidas' },
        { id: 'prod-demo-1005', name: 'Leche Entera Caja 1L', sku: '1005', price: 1350, brand: 'Soprole', category: 'Lácteos' },
        { id: 'prod-demo-1006', name: 'Mantequilla con Sal 250g', sku: '1006', price: 2800, brand: 'Soprole', category: 'Lácteos' },
        { id: 'prod-demo-1007', name: 'Esponja Multiuso', sku: '1007', price: 1500, brand: 'Virutex', category: 'Limpieza' },
        { id: 'prod-demo-1008', name: 'Paño de Cocina', sku: '1008', price: 1800, brand: 'Virutex', category: 'Limpieza' },
        { id: 'prod-demo-1009', name: 'Papas Fritas Corte Americano', sku: '1009', price: 1990, brand: 'Evercrisp', category: 'Snacks' },
        { id: 'prod-demo-1010', name: 'Ramitas Saladas', sku: '1010', price: 1200, brand: 'Evercrisp', category: 'Snacks' },
    ];

    for (const p of productsData) {
        const product = await prisma.product.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                price: p.price,
                brandId: brands[p.brand],
                categoryId: categories[p.category],
            },
            create: {
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: p.price,
                tenantId: TENANT_ID,
                brandId: brands[p.brand],
                categoryId: categories[p.category],
                isActive: true,
            },
        });

        // Inventario en sucursal principal
        await prisma.inventory.upsert({
            where: { productId_branchId: { productId: product.id, branchId: BRANCH_MAIN_ID } },
            update: {},
            create: {
                productId: product.id,
                branchId: BRANCH_MAIN_ID,
                quantity: 50,
                minStock: 5,
            },
        });

        // Inventario en Sucursal Providencia
        await prisma.inventory.upsert({
            where: { productId_branchId: { productId: product.id, branchId: BRANCH_PROVIDENCIA_ID } },
            update: {},
            create: {
                productId: product.id,
                branchId: BRANCH_PROVIDENCIA_ID,
                quantity: 30,
                minStock: 5,
            },
        });

        console.log(`✅ Producto: ${p.name} — $${p.price.toLocaleString('es-CL')} CLP (SKU: ${p.sku})`);
    }

    // ── 5. CLIENTES ───────────────────────────────────────────────────────
    const customersData = [
        { rut: '15.123.456-7', name: 'Juan Pérez', email: 'juan.perez@email.cl' },
        { rut: '18.765.432-1', name: 'María González', email: 'maria.g@email.cl' },
        { rut: '12.345.678-9', name: 'Pedro Soto', email: 'psoto@email.cl' },
        { rut: '19.987.654-3', name: 'Camila Silva', email: 'camila.silva@email.cl' },
        { rut: '16.555.444-K', name: 'Diego Rojas', email: 'drojas@email.cl' },
    ];

    for (const c of customersData) {
        const customer = await prisma.customer.upsert({
            where: { rut_tenantId: { rut: c.rut, tenantId: TENANT_ID } },
            update: { email: c.email },
            create: {
                name: c.name,
                rut: c.rut,
                email: c.email,
                tenantId: TENANT_ID,
            },
        });
        console.log(`✅ Cliente: ${customer.name} — RUT: ${customer.rut}`);
    }

    console.log('\n🎉 Seed de demostración completado exitosamente!');
    console.log(`   📦 1 sucursal adicional`);
    console.log(`   🏷️  5 categorías`);
    console.log(`   🔖 5 marcas`);
    console.log(`   🛒 10 productos (con stock en 2 sucursales)`);
    console.log(`   👥 5 clientes chilenos`);
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed de demo:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
