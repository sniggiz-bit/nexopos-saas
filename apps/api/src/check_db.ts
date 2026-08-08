import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE DIAGNOSTIC START ---');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true },
  });
  console.log('\n--- TENANTS ---');
  console.dir(tenants, { depth: null });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, tenantId: true },
  });
  console.log('\n--- USERS ---');
  console.dir(users, { depth: null });

  const products = await prisma.product.findMany({
    select: { id: true, name: true, tenantId: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('\n--- PRODUCTS (last 10) ---');
  console.dir(products.slice(0, 10), { depth: null });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
