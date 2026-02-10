/**
 * Script to generate internal receipts for existing sales
 * Run with: npx ts-node scripts/generate-receipts.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { InternalReceiptService } from '../src/dte/internal-receipt.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.slice(-10) : 'MISSING');

    // Initialize Prisma with Adapter (same as PrismaService)
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const prismaService = new PrismaService();
    // PrismaService constructor also initializes its own pool and adapter
    const receiptService = new InternalReceiptService(prismaService);

    try {
        console.log('🔍 Buscando ventas sin ticket interno...');

        // Get all sales
        const sales = await (prisma.sale as any).findMany({
            select: {
                id: true,
                total: true,
                createdAt: true,
                internalReceiptUrl: true,
            },
        });

        console.log(`📊 Total de ventas en la DB: ${sales.length}`);
        sales.forEach(s => console.log(`   - Sale ${s.id.substring(0, 8)}: internalReceiptUrl = [${s.internalReceiptUrl}]`));

        // Filter sales without internal receipt
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
            } catch (error: any) {
                errorCount++;
                console.error(`❌ Error generando ticket: ${error.message}`);
            }
        }

        console.log(`\n\n📊 Resumen:`);
        console.log(`   ✅ Exitosos: ${successCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📝 Total: ${salesWithoutReceipt.length}`);

    } catch (error: any) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

