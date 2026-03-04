
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('1234', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@nexopos.cl' },
        update: {
            password: hashedPassword,
            role: 'TENANT_ADMIN',
        },
        create: {
            email: 'admin@nexopos.cl',
            name: 'Admin Principal',
            password: hashedPassword,
            role: 'TENANT_ADMIN',
            tenantId: 'tenant-1', // Assuming tenant-1 exists from seed
            branchId: 'branch-1', // Assuming branch-1 exists from seed
        },
    });

    console.log('✅ Admin User Created/Updated:');
    console.log('Email: admin@nexopos.cl');
    console.log('Password: 1234');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
