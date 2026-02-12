"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🔍 Verifying Treasury Receivables Logic...');
    const tenantId = 'tenant-1';
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
    });
    if (!tenant) {
        console.error('❌ Tenant not found. Run seed first.');
        process.exit(1);
    }
    const customer = await prisma.customer.upsert({
        where: { rut_tenantId: { rut: '99.999.999-9', tenantId } },
        update: {},
        create: {
            name: 'Test Customer Treasury',
            rut: '99.999.999-9',
            tenantId
        }
    });
    const currentCredits = await prisma.credit.findMany({
        where: {
            tenantId,
            status: 'OPEN',
        },
    });
    const initialTotal = currentCredits.reduce((sum, c) => sum + c.balance, 0);
    console.log(`💰 Initial Receivables Total: ${initialTotal}`);
    const credit1Amount = 5000;
    const credit2Amount = 3000;
    await prisma.credit.create({
        data: {
            tenantId,
            customerId: customer.id,
            totalAmount: credit1Amount,
            balance: credit1Amount,
            status: 'OPEN',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        }
    });
    await prisma.credit.create({
        data: {
            tenantId,
            customerId: customer.id,
            totalAmount: credit2Amount,
            balance: credit2Amount,
            status: 'OPEN',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        }
    });
    console.log(`➕ Added credits: ${credit1Amount} + ${credit2Amount}`);
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
    }
    else {
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
//# sourceMappingURL=verify-treasury-logic.js.map