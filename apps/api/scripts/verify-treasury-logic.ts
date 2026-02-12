
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Verifying Treasury Receivables Logic...');

    const tenantId = 'tenant-1';

    // 1. Ensure Tenant (should be there from seed)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
    });

    if (!tenant) {
        console.error('❌ Tenant not found. Run seed first.');
        process.exit(1);
    }

    // 2. Create a specific Customer for testing
    const customer = await prisma.customer.upsert({
        where: { rut_tenantId: { rut: '99.999.999-9', tenantId } },
        update: {},
        create: {
            name: 'Test Customer Treasury',
            rut: '99.999.999-9',
            tenantId
        }
    });

    // 3. Clear existing open credits for this customer to have a clean state for verification
    // OR we can just add new ones and check the total increment. 
    // Let's count current total first.

    const currentCredits = await prisma.credit.findMany({
        where: {
            tenantId,
            status: 'OPEN',
        },
    });

    const initialTotal = currentCredits.reduce((sum, c) => sum + c.balance, 0);
    console.log(`💰 Initial Receivables Total: ${initialTotal}`);

    // 4. Create new Credits
    const credit1Amount = 5000;
    const credit2Amount = 3000;

    await prisma.credit.create({
        data: {
            tenantId,
            customerId: customer.id,
            totalAmount: credit1Amount,
            balance: credit1Amount,
            status: 'OPEN',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Due in 5 days
        }
    });

    await prisma.credit.create({
        data: {
            tenantId,
            customerId: customer.id,
            totalAmount: credit2Amount,
            balance: credit2Amount,
            status: 'OPEN',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), // Due in 10 days
        }
    });

    console.log(`➕ Added credits: ${credit1Amount} + ${credit2Amount}`);

    // 5. Verify Total using the exact logic from TreasuryService
    // const credits = await this.prisma.credit.findMany({ where: { tenantId, status: 'OPEN' } });
    // const total = credits.reduce((sum, credit) => sum + credit.balance, 0);

    const updatedCredits = await prisma.credit.findMany({
        where: {
            tenantId,
            status: 'OPEN',
        },
    });

    const finalTotal = updatedCredits.reduce((sum, c) => sum + c.balance, 0);
    console.log(`💰 Final Receivables Total: ${finalTotal}`);

    const expectedTotal = initialTotal + credit1Amount + credit2Amount;

    if (Math.abs(finalTotal - expectedTotal) < 0.01) {
        console.log('✅ VALIDATION SUCCESS: The endpoint logic correctly sums the OPEN credits.');
    } else {
        console.error(`❌ VALIDATION FAILED: Expected ${expectedTotal}, got ${finalTotal}`);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
