const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const user = await prisma.user.findUnique({ where: { email: 'admin@demo.cl' } });
        console.log('User:', user);
        if (user) {
            const products = await prisma.product.findMany({ where: { tenantId: user.tenantId } });
            console.log('Total products for tenant:', products.length);
        }
    } catch (e) {
        console.error(e);
    }
}
main().finally(() => prisma.$disconnect());
