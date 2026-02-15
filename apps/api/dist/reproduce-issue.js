"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log('Checking if tenant-1 exists...');
        const tenant = await prisma.tenant.findUnique({
            where: { id: 'tenant-1' },
        });
        if (!tenant) {
            console.error('❌ Tenant-1 does NOT exist!');
            return;
        }
        console.log('✅ Tenant-1 exists:', tenant.name);
        console.log('Attempting to create a customer...');
        const customer = await prisma.customer.create({
            data: {
                name: 'Test Customer',
                rut: '99.999.999-9',
                tenantId: 'tenant-1',
                email: 'test@example.com',
            },
        });
        console.log('✅ Customer created:', customer);
        await prisma.customer.delete({ where: { id: customer.id } });
        console.log('✅ Cleaned up test customer');
    }
    catch (error) {
        console.error('❌ Error creating customer:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=reproduce-issue.js.map