require('dotenv').config();
const { Client } = require('pg');
const { startOfDay, endOfDay, startOfMonth } = require('date-fns');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        const tenantId = '78a08935-797b-4123-90ab-a4b32709cad7';
        const branchId = 'branch-providencia';

        // 1. Total products count
        const prodCountRes = await client.query(
            'SELECT count(*)::int as count FROM "Product" WHERE "tenantId" = $1 AND "isActive" = true', 
            [tenantId]
        );
        console.log('Active Products count in DB:', prodCountRes.rows[0].count);

        // 2. Sales query
        const salesRes = await client.query(
            'SELECT id, total, "branchId", "createdAt", status FROM "Sale" WHERE "tenantId" = $1',
            [tenantId]
        );
        console.log(`Total sales for tenant: ${salesRes.rows.length}`);
        
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const monthStart = startOfMonth(new Date());

        console.log('JS system current date:', new Date());
        console.log('Today start:', todayStart);
        console.log('Today end:', todayEnd);
        console.log('Month start:', monthStart);

        let salesTodaySum = 0;
        let monthRevenueSum = 0;

        for (const sale of salesRes.rows) {
            const createdAt = new Date(sale.createdAt);
            const isCompleted = sale.status === 'COMPLETED';
            const matchesBranch = sale.branchId === branchId;

            if (isCompleted && matchesBranch) {
                if (createdAt >= todayStart && createdAt <= todayEnd) {
                    salesTodaySum += Number(sale.total);
                }
                if (createdAt >= monthStart) {
                    monthRevenueSum += Number(sale.total);
                }
            }
            console.log(`Sale ${sale.id}: branch=${sale.branchId}, status=${sale.status}, createdAt=${sale.createdAt} (parsed: ${createdAt}), total=${sale.total}`);
        }

        console.log('--- Computations ---');
        console.log('Sales Today Sum:', salesTodaySum);
        console.log('Month Revenue Sum:', monthRevenueSum);

    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
