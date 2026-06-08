import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const plansCount = await prisma.plan.count();
    console.log("Total planes en DB:", plansCount);
    
    const usersCount = await prisma.user.count();
    console.log("Total users en DB:", usersCount);
}

main().finally(() => prisma.$disconnect());
