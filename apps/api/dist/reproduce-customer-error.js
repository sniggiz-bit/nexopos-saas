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
    console.log('🔍 Starting Customer Creation Reproduction...');
    try {
        const customerData = {
            name: 'Alejandra Fravega',
            rut: '15.365.325.9',
            giro: 'Venta de ropa',
            address: 'alameda 1234',
            comuna: 'Rancagua',
            email: 'paz.fravega7@gmail.com',
            phone: '979106356',
            tenantId: 'tenant-1'
        };
        console.log('Attempting to create customer:', customerData);
        const existing = await prisma.customer.findFirst({
            where: { rut: customerData.rut, tenantId: customerData.tenantId }
        });
        if (existing) {
            console.log('⚠️ Customer already exists with ID:', existing.id);
        }
        const created = await prisma.customer.create({
            data: customerData
        });
        console.log('✅ Customer created successfully:', created);
        await prisma.customer.delete({ where: { id: created.id } });
        console.log('✅ Cleaned up.');
    }
    catch (error) {
        console.error('❌ ERROR REPRODUCING ISSUE:', error);
        if (error.code)
            console.error('Error Code:', error.code);
        if (error.meta)
            console.error('Error Meta:', error.meta);
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=reproduce-customer-error.js.map