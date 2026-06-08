require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { startOfDay, endOfDay, startOfMonth } = require('date-fns');

const prisma = new PrismaClient();

async function run() {
    try {
        const tenantId = '78a08935-797b-4123-90ab-a4b32709cad7';
        const branchId = 'branch-providencia';

        const today = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const firstDayOfMonth = startOfMonth(new Date());

        const totalProducts = await prisma.product.count({
          where: {
            tenantId,
            isActive: true,
          },
        });

        const salesTodayResult = await prisma.sale.aggregate({
          where: {
            tenantId,
            branchId,
            status: 'COMPLETED',
            createdAt: {
              gte: today,
              lte: todayEnd,
            },
          },
          _sum: {
            total: true,
          },
        });

        const monthRevenueResult = await prisma.sale.aggregate({
          where: {
            tenantId,
            branchId,
            status: 'COMPLETED',
            createdAt: {
              gte: firstDayOfMonth,
            },
          },
          _sum: {
            total: true,
          },
        });

        const lowStockResult = await prisma.$queryRaw`
          SELECT COUNT(*)::int AS count
          FROM "Product" p
          LEFT JOIN "InventoryLevel" i ON p.id = i."productId" AND i."branchId" = ${branchId}
          WHERE p."tenantId" = ${tenantId}
            AND p."isActive" = true
            AND COALESCE(i.quantity, 0) <= p."minStock"
        `;

        console.log({
            totalProducts,
            salesToday: salesTodayResult._sum.total || 0,
            monthRevenue: monthRevenueResult._sum.total || 0,
            lowStockCount: lowStockResult[0]?.count || 0
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
