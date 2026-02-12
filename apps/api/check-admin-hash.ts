
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@nexopos.cl' },
    });

    if (admin) {
        console.log('Admin found:', admin.email);
        console.log('Password hash start:', admin.password.substring(0, 10)); // Show only start for security/debug
        console.log('Role:', admin.role);
    } else {
        console.log('Admin user NOT found.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
