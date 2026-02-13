import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Script neutralized to avoid build errors
    console.log('Script neutralized.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
