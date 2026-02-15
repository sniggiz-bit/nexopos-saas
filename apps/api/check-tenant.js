const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                storeSlug: true,
                storeSettings: true,
            }
        });
        console.log(JSON.stringify(tenants, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
