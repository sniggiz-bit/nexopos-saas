import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
      },
    });
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-------------------------');
  } catch (e) {
    console.error('Error fetching users:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
