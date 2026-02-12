
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixTenant() {
    try {
        console.log('Checking tenant-1...');
        const tenant = await prisma.tenant.upsert({
            where: { id: 'tenant-1' },
            update: {},
            create: {
                id: 'tenant-1',
                name: 'Comercial Chile SpA',
            },
        });
        console.log('Tenant ensured:', tenant);
        fs.writeFileSync('fix-log.txt', `Tenant ensured: ${JSON.stringify(tenant)}`);
    } catch (e) {
        console.error('Error:', e);
        fs.writeFileSync('fix-log.txt', `Error: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

fixTenant();
