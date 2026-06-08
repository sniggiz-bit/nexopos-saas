const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Products:', await prisma.product.count());
    console.log('Products for tenant:', await prisma.product.count({ where: { tenantId: 'cm9z2q3x00000r7z0x3x0x3x0' }})); // wait, I don't know the tenantId
    console.log('Tenants:', await prisma.tenant.findMany({ select: { id: true, name: true } }));
}
main().finally(() => prisma.$disconnect());
