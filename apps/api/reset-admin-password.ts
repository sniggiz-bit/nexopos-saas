
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Resetting password for admin@nexopos.cl...');
    const admin = await prisma.user.update({
        where: { email: 'admin@nexopos.cl' },
        data: {
            password: '1234', // Plain text, system will auto-hash on login
        },
    });

    console.log('✅ Admin Password Reset to plain text "1234"');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
