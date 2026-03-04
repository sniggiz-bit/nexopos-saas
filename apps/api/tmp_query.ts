import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ take: 3 });
    console.log("Users:", JSON.stringify(users, null, 2));

    // See if there's any transfer error
    // If no error logs, let's at least get a valid user
}

main().finally(() => prisma.$disconnect());
