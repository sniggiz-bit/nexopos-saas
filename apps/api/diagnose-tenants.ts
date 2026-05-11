import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                plan: true,
                settings: true,
                users: {
                    where: { role: 'TENANT_ADMIN' },
                    take: 1,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: { users: true, branches: true },
                },
            } as any,
        });
        console.log("Tenants found:", tenants.length);
        console.dir(tenants, { depth: null });
    } catch (error) {
        console.error("Error executing query:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
