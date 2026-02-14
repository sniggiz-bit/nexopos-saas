"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: 'apps/api/.env' });
console.log('Script started');
let prisma;
try {
    console.log('Initializing Prisma Client with Adapter...');
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    prisma = new client_1.PrismaClient({
        adapter,
        log: ['query', 'info', 'warn', 'error'],
    });
    console.log('Prisma Client initialized');
}
catch (e) {
    console.error('Failed to initialize Prisma Client:', e);
    process.exit(1);
}
async function main() {
    console.log('🚀 Starting Multi-Branch Migration...');
    const tenants = await prisma.tenant.findMany();
    console.log(`Creating branches for ${tenants.length} tenants...`);
    for (const tenant of tenants) {
        let mainBranch = await prisma.branch.findFirst({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'asc' }
        });
        if (mainBranch) {
            console.log(`Found existing branch ${mainBranch.name}, promoting to Main.`);
            mainBranch = await prisma.branch.update({
                where: { id: mainBranch.id },
                data: { isMain: true, name: 'Casa Matriz' }
            });
        }
        else {
            console.log(`Creating main branch for tenant ${tenant.name}`);
            mainBranch = await prisma.branch.create({
                data: {
                    name: 'Casa Matriz',
                    address: tenant.address || 'Dirección Principal',
                    isMain: true,
                    tenantId: tenant.id,
                },
            });
        }
        const products = await prisma.product.findMany({
            where: { tenantId: tenant.id },
            include: { inventory: true },
        });
        console.log(`Migrating stock for ${products.length} products in ${tenant.name}...`);
        for (const product of products) {
            const legacyStock = product.stock;
            if (typeof legacyStock === 'number') {
                await prisma.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: product.id,
                            branchId: mainBranch.id,
                        },
                    },
                    create: {
                        productId: product.id,
                        branchId: mainBranch.id,
                        quantity: legacyStock,
                        minStock: product.minStock,
                    },
                    update: {
                        quantity: legacyStock,
                    },
                });
                console.log(`Migrated ${legacyStock} units for ${product.name}`);
            }
            else {
            }
        }
    }
    console.log('✅ Migration completed successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-migration-branches.js.map