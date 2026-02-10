"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const internal_receipt_service_1 = require("../src/dte/internal-receipt.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
async function main() {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.slice(-10) : 'MISSING');
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    const prismaService = new prisma_service_1.PrismaService();
    const receiptService = new internal_receipt_service_1.InternalReceiptService(prismaService);
    try {
        console.log('🔍 Buscando ventas sin ticket interno...');
        const sales = await prisma.sale.findMany({
            select: {
                id: true,
                total: true,
                createdAt: true,
                internalReceiptUrl: true,
            },
        });
        console.log(`📊 Total de ventas en la DB: ${sales.length}`);
        sales.forEach(s => console.log(`   - Sale ${s.id.substring(0, 8)}: internalReceiptUrl = [${s.internalReceiptUrl}]`));
        const salesWithoutReceipt = sales.filter(s => !s.internalReceiptUrl);
        console.log(`📋 Encontradas ${salesWithoutReceipt.length} ventas sin ticket interno`);
        let successCount = 0;
        let errorCount = 0;
        for (const sale of salesWithoutReceipt) {
            try {
                console.log(`\n📄 Generando ticket para venta ${sale.id.substring(0, 8)}...`);
                await receiptService.generateReceipt(sale.id);
                successCount++;
                console.log(`✅ Ticket generado exitosamente`);
            }
            catch (error) {
                errorCount++;
                console.error(`❌ Error generando ticket: ${error.message}`);
            }
        }
        console.log(`\n\n📊 Resumen:`);
        console.log(`   ✅ Exitosos: ${successCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📝 Total: ${salesWithoutReceipt.length}`);
    }
    catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=generate-receipts.js.map