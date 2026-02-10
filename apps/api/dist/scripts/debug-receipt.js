"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const internal_receipt_service_1 = require("../src/dte/internal-receipt.service");
async function main() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    const mockPrismaService = {
        sale: prisma.sale,
        tenant: prisma.tenant,
        branch: prisma.branch,
        user: prisma.user,
        $transaction: prisma.$transaction,
    };
    const receiptService = new internal_receipt_service_1.InternalReceiptService(mockPrismaService);
    const saleId = 'ab9972ad-ac82-40fa-b30d-fa2b33455cc7';
    console.log(`🚀 Testing receipt generation for sale ${saleId}...`);
    try {
        const result = await receiptService.generateReceipt(saleId);
        console.log(`✅ Success! Result: ${result}`);
    }
    catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        console.error(error.stack);
    }
    finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
main();
//# sourceMappingURL=debug-receipt.js.map