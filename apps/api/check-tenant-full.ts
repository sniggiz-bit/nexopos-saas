import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    console.log('🔍 Checking Tenant Settings...');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                storeSlug: true,
                storeSettings: true,
            }
        });

        console.log(JSON.stringify(tenants, null, 2));

    } catch (error) {
        console.error('❌ DATABASE ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
