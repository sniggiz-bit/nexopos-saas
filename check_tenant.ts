import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const tenantId = 'tenant-1';
        console.log(`Checking tenant: ${tenantId}`);
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (tenant) {
            console.log('✅ Tenant found:', tenant);
        } else {
            console.log('❌ Tenant NOT found!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
