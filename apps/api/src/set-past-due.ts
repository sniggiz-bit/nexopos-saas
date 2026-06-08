import { PrismaClient, BillingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  await prisma.tenant.updateMany({
    data: {
      billingStatus: BillingStatus.PAST_DUE,
    }
  });
  console.log('All tenants marked as PAST_DUE');
  await prisma.$disconnect();
}

run();
