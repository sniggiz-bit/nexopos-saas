const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Products:', await prisma.product.count());
    console.log('Users:', await prisma.user.count());
    console.log('Tenants:', await prisma.tenant.count());
}
main().finally(() => prisma.$disconnect());
