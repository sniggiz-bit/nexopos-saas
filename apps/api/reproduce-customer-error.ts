import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Starting Customer Creation Reproduction...');
    try {
        // Data from screenshot
        const customerData = {
            name: 'Alejandra Fravega',
            rut: '15.365.325.9',
            giro: 'Venta de ropa',
            address: 'alameda 1234',
            comuna: 'Rancagua',
            email: 'paz.fravega7@gmail.com',
            phone: '979106356',
            tenantId: 'tenant-1' // Assuming tenant-1
        };

        console.log('Attempting to create customer:', customerData);

        // Check if exists first to avoid unique constraint if that's the issue (though we want to see the error)
        const existing = await prisma.customer.findFirst({
            where: { rut: customerData.rut, tenantId: customerData.tenantId }
        });

        if (existing) {
            console.log('⚠️ Customer already exists with ID:', existing.id);
            // We might want to try creating anyway to see if it throws the EXPECTED P2002 error
        }

        const created = await prisma.customer.create({
            data: customerData
        });

        console.log('✅ Customer created successfully:', created);

        // Clean up
        await prisma.customer.delete({ where: { id: created.id } });
        console.log('✅ Cleaned up.');

    } catch (error: any) {
        console.error('❌ ERROR REPRODUCING ISSUE:', error);
        if (error.code) console.error('Error Code:', error.code);
        if (error.meta) console.error('Error Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
