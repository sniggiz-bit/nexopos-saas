
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenants() {
    try {
        const tenants = await prisma.tenant.findMany();
        console.log('Tenants:', tenants);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkTenants();
