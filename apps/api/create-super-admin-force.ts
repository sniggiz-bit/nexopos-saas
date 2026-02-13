import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
    console.log('🚀 Creating/Updating Super Admin...');
    const email = 'admin@nexopos-saas.cl';
    const passwordRaw = 'supersecretpassword';

    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    // Ensure tenant exists (from seed)
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
            id: 'tenant-1',
            name: 'Comercial Chile SpA',
        },
    });

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'SUPER_ADMIN', // Ensure role is correct
        },
        create: {
            email,
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
        },
    });

    console.log(`✅ Super Admin configured: ${user.email}`);
    console.log(`🔑 Password: ${passwordRaw}`);
    console.log(`🎭 Role: ${user.role}`);

    await prisma.$disconnect();
}

createSuperAdmin().catch((e) => {
    console.error(e);
    process.exit(1);
});
