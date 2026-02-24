import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting branch repair script...');

    const tenants = await prisma.tenant.findMany({
        include: {
            branches: true,
        },
    });

    console.log(`Found ${tenants.length} tenants. Checking branches...`);

    for (const tenant of tenants) {
        const hasMainBranch = tenant.branches.some(b => b.isMain);

        if (!hasMainBranch) {
            console.log(`Tenant ${tenant.id} (${tenant.name}) missing main branch. Creating 'Casa Matriz'...`);
            await prisma.branch.create({
                data: {
                    name: 'Casa Matriz',
                    address: 'Principal',
                    isMain: true,
                    tenantId: tenant.id,
                },
            });
            console.log(`Created main branch for tenant ${tenant.id}.`);
        } else {
            console.log(`Tenant ${tenant.id} already has a main branch.`);
        }
    }

    console.log('Branch repair completed.');
}

main()
    .catch((e) => {
        console.error('Error during branch repair:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
