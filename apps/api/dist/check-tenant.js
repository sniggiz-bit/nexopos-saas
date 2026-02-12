"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkTenants() {
    try {
        const tenants = await prisma.tenant.findMany();
        console.log('Tenants:', tenants);
    }
    catch (e) {
        console.error('Error:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkTenants();
//# sourceMappingURL=check-tenant.js.map