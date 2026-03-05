import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const fallbackDbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@nexopos_postgres:5432/nexopos_db";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: fallbackDbUrl,
        },
    },
});

async function main() {
    console.log('🌱 Iniciando seed de la base de datos (Datos Chilenos)...');

    // 1. Crear o Actualizar Tenant Inicial
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'supermercado-demo' },
        update: {},
        create: {
            name: 'Supermercado Demo',
            slug: 'supermercado-demo',
            rut: '76.123.456-7',
            giro: 'Comercio al por menor de abarrotes',
        },
    });
    console.log('✅ Tenant creado/verificado:', tenant.name);

    // 2. Crear o Actualizar Sucursales (Branches)
    const branch1 = await prisma.branch.upsert({
        where: { id: 'branch-providencia' }, // Id determinista
        update: {},
        create: {
            id: 'branch-providencia',
            name: 'Providencia',
            isMain: true,
            isActive: true,
            tenantId: tenant.id,
        },
    });
    console.log('✅ Sucursal creada:', branch1.name);

    const branch2 = await prisma.branch.upsert({
        where: { id: 'branch-santiago-centro' },
        update: {},
        create: {
            id: 'branch-santiago-centro',
            name: 'Santiago Centro',
            isMain: false,
            isActive: true,
            tenantId: tenant.id,
        },
    });
    console.log('✅ Sucursal creada:', branch2.name);

    // 3. Crear Usuario Administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@demo.cl' },
        update: {
            password: hashedPassword, // Reset password to default if seed is run again
            role: 'TENANT_ADMIN',
            branchId: branch1.id,
        },
        create: {
            email: 'admin@demo.cl',
            name: 'Administrador Demo',
            password: hashedPassword,
            role: 'TENANT_ADMIN',
            tenantId: tenant.id,
            branchId: branch1.id,
        },
    });
    console.log('✅ Usuario Administrador creado:', adminUser.email);

    // 4. Crear Proveedores (Suppliers)
    const supplier1 = await prisma.supplier.upsert({
        where: { id: 'sup-dist-andina' },
        update: {},
        create: {
            id: 'sup-dist-andina',
            name: 'Distribuidora Andina S.A.',
            rut: '90.413.000-1',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Proveedor creado:', supplier1.name);

    const supplier2 = await prisma.supplier.upsert({
        where: { id: 'sup-com-abarrotes' },
        update: {},
        create: {
            id: 'sup-com-abarrotes',
            name: 'Comercializadora de Abarrotes SpA',
            rut: '77.567.890-2',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Proveedor creado:', supplier2.name);

    // 5. Crear Categorías
    const catBebidas = await prisma.category.upsert({
        where: { name_tenantId: { name: 'Bebidas', tenantId: tenant.id } },
        update: {},
        create: {
            name: 'Bebidas',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Categoría creada:', catBebidas.name);

    const catAbarrotes = await prisma.category.upsert({
        where: { name_tenantId: { name: 'Abarrotes', tenantId: tenant.id } },
        update: {},
        create: {
            name: 'Abarrotes',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Categoría creada:', catAbarrotes.name);

    // 6. Crear Productos e Inventario
    const product1 = await prisma.product.upsert({
        where: { id: 'prod-beb-cc25' },
        update: {},
        create: {
            id: 'prod-beb-cc25',
            name: 'Bebida Coca-Cola Original 2.5L',
            sku: 'BEB-CC25',
            barcode: 'BEB-CC25',
            price: 2500,
            costPrice: 1500,
            categoryId: catBebidas.id,
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Producto creado: ${product1.name} ($${product1.price} CLP)`);

    const product2 = await prisma.product.upsert({
        where: { id: 'prod-aba-fce' },
        update: {},
        create: {
            id: 'prod-aba-fce',
            name: 'Fideos Carozzi Espinaca 400g',
            sku: 'ABA-FCE',
            barcode: 'ABA-FCE',
            price: 1200,
            costPrice: 750,
            categoryId: catAbarrotes.id,
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Producto creado: ${product2.name} ($${product2.price} CLP)`);

    const product3 = await prisma.product.upsert({
        where: { id: 'prod-aba-at2' },
        update: {},
        create: {
            id: 'prod-aba-at2',
            name: 'Arroz Tucapel Grado 2 1kg',
            sku: 'ABA-AT2',
            barcode: 'ABA-AT2',
            price: 1990,
            costPrice: 1200,
            categoryId: catAbarrotes.id,
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Producto creado: ${product3.name} ($${product3.price} CLP)`);

    // 7. Crear Inventario Inicial
    const products = [product1, product2, product3];
    for (const prod of products) {
        await prisma.inventory.upsert({
            where: {
                productId_branchId: {
                    productId: prod.id,
                    branchId: branch1.id,
                },
            },
            update: {
                quantity: 100, // Forzamos 100 en Providencia
            },
            create: {
                productId: prod.id,
                branchId: branch1.id,
                quantity: 100,
            },
        });
    }
    console.log('✅ Inventario inicial establecido en 100 unidades para Providencia.');

    console.log('\n🎉 Seed con datos chilenos completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
