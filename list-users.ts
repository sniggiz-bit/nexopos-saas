import { PrismaClient } from './apps/api/node_modules/@prisma/client';
import 'dotenv/config';

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:51214/postgres?schema=public"
            }
        }
    });
    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true,
                name: true
            }
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
