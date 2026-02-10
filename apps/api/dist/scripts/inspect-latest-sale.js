"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
async function main() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
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
    }
    catch (error) {
        console.error('Error fetching latest sale:', error.message);
    }
    finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
main();
//# sourceMappingURL=inspect-latest-sale.js.map