import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    console.log('🌱 Starting Product Seeder...');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Get Tenant and Branch
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) throw new Error('No tenant found. Please run basic seed first.');

        const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
        if (!branch) throw new Error('No branch found for tenant.');

        const user = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
        const userId = user?.id; // Optional for now

        console.log(`Target: Tenant ${tenant.name}, Branch ${branch.name}`);

        // 2. Define Products
        const productsToSeed = [
            { name: 'Coca Cola 3L', price: 2500, sku: 'COCA3L' },
            { name: 'Arroz Tucapel G2', price: 1300, sku: 'ARROZ001' },
            { name: 'Aceite Maravilla 1L', price: 1800, sku: 'ACEITE01' },
            { name: 'Pan Hallulla (Kg)', price: 1990, sku: 'PAN001', unit: 'KG' },
        ];

        for (const p of productsToSeed) {
            // Check if exists
            const existing = await prisma.product.findFirst({
                where: { sku: p.sku, tenantId: tenant.id }
            });

            if (!existing) {
                console.log(`Creating ${p.name}...`);
                await prisma.product.create({
                    data: {
                        name: p.name,
                        sku: p.sku,
                        price: p.price,
                        tenantId: tenant.id,
                        inventory: {
                            create: {
                                branchId: branch.id,
                                quantity: 100, // Initial Stock
                                minStock: 10
                            }
                        }
                    }
                });
            } else {
                console.log(`Skipping ${p.name} (Already exists)`);
                // Ensure inventory exists
                const inv = await prisma.inventoryLevel.findUnique({
                    where: { productId_branchId: { productId: existing.id, branchId: branch.id } }
                });
                if (!inv) {
                    console.log(`-> Adding missing inventory for ${p.name}`);
                    await prisma.inventoryLevel.create({
                        data: {
                            productId: existing.id,
                            branchId: branch.id,
                            quantity: 100
                        }
                    });
                }
            }
        }
        console.log('✅ Seeding complete.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
