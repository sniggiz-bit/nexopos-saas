const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { email: true, tenantId: true, branchId: true } });
    console.log('USERS:', users);
    
    const products = await prisma.product.count({ where: { tenantId: users[0].tenantId } });
    console.log('PRODUCTS FOR TENANT:', products);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); });
