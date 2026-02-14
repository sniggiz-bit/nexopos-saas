import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const tenantId = 'tenant-1';
    const branchId = 'branch-1';

    console.log('--- Checking Database Consistency ---');
    console.log(`Tenant: ${tenantId}, Branch: ${branchId}`);

    const products = await prisma.product.findMany({
        where: { tenantId }
    });

    console.log(`\nProducts for Tenant ${tenantId}:`);
    for (const p of products) {
        const inventory = await prisma.inventory.findUnique({
            where: {
                productId_branchId: {
                    productId: p.id,
                    branchId: branchId,
                }
            }
        });
        console.log(`- ${p.name} (ID: ${p.id}, Price: ${p.price}, Stock in Branch: ${inventory ? inventory.quantity : 'NOT FOUND'})`);
    }

    await prisma.$disconnect();
}

check();
