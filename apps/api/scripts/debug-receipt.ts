
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { InternalReceiptService } from '../src/dte/internal-receipt.service';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    // Mock PrismaService for the ReceiptService
    const mockPrismaService = {
        sale: prisma.sale,
        tenant: prisma.tenant,
        branch: prisma.branch,
        user: prisma.user,
        $transaction: prisma.$transaction,
    } as any;

    const receiptService = new InternalReceiptService(mockPrismaService);
    const saleId = 'ab9972ad-ac82-40fa-b30d-fa2b33455cc7'; // Folio 2563

    console.log(`🚀 Testing receipt generation for sale ${saleId}...`);

    try {
        const result = await receiptService.generateReceipt(saleId);
        console.log(`✅ Success! Result: ${result}`);
    } catch (error: any) {
        console.error(`❌ FAILED: ${error.message}`);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
