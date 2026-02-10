
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const sale = await prisma.sale.findFirst({
            where: { dteFolio: 6250 },
            select: {
                id: true,
                total: true,
                dteFolio: true,
                dtePdfUrl: true,
                internalReceiptUrl: true,
                createdAt: true
            }
        });

        console.log('SALE_8557_DETAILS:');
        console.log(JSON.stringify(sale, null, 2));

    } catch (error: any) {
        console.error('Error fetching latest sale:', error.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
