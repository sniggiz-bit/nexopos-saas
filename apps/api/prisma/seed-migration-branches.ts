import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'apps/api/.env' });

console.log('Script started');
let prisma;
try {
    console.log('Initializing Prisma Client with Adapter...');
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
        adapter,
        log: ['query', 'info', 'warn', 'error'],
    });
    console.log('Prisma Client initialized');
} catch (e) {
    console.error('Failed to initialize Prisma Client:', e);
    process.exit(1);
}

async function main() {
    console.log('🚀 Starting Multi-Branch Migration...');

    // 1. Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`Creating branches for ${tenants.length} tenants...`);

    for (const tenant of tenants) {
        // 2. Check/Create "Casa Matriz"
        let mainBranch = await prisma.branch.findFirst({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'asc' } // Take the oldest one as main
        });

        if (mainBranch) {
            console.log(`Found existing branch ${mainBranch.name}, promoting to Main.`);
            mainBranch = await prisma.branch.update({
                where: { id: mainBranch.id },
                data: { isMain: true, name: 'Casa Matriz' } // Rename/Mark as main
            });
        } else {
            console.log(`Creating main branch for tenant ${tenant.name}`);
            mainBranch = await prisma.branch.create({
                data: {
                    name: 'Casa Matriz',
                    address: tenant.address || 'Dirección Principal',
                    isMain: true,
                    tenantId: tenant.id,
                },
            });
        }

        // 3. Migrate Product Stock
        const products = await prisma.product.findMany({
            where: { tenantId: tenant.id },
            include: { inventory: true }, // include existing inventory if any
        });

        console.log(`Migrating stock for ${products.length} products in ${tenant.name}...`);

        for (const product of products) {
            const legacyStock = product.stock;

            if (typeof legacyStock === 'number') {
                // Upsert Inventory for Main Branch
                await prisma.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: product.id,
                            branchId: mainBranch.id,
                        },
                    },
                    create: {
                        productId: product.id,
                        branchId: mainBranch.id,
                        quantity: legacyStock,
                        minStock: product.minStock,
                    },
                    update: {
                        quantity: legacyStock,
                    },
                });
                console.log(`Migrated ${legacyStock} units for ${product.name}`);
            } else {
                // No legacy stock found, skipping.
            }
        }
    }

    console.log('✅ Migration completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
