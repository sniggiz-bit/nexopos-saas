import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Checking Tenants...');
    const tenants = await prisma.tenant.findMany({
        include: {
            plan: true,
            users: true
        }
    });

    console.log(`Found ${tenants.length} tenants.`);
    tenants.forEach(t => {
        console.log(`- ${t.name} (Status: ${t.status}, Plan: ${t.plan?.name}, Users: ${t.users.length})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
