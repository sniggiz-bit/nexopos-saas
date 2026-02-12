
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Starting Kardex Verification (JS)...');

    try {
        // 1. Create Product with Initial Stock
        const timestamp = Date.now();
        console.log(`1. Creating Product with Initial Stock (100) - Timestamp: ${timestamp}...`);

        const tenantId = 'tenant-1'; // Ensure this tenant exists or use one that does
        // Check if tenant exists
        let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            console.log('Creating tenant-1...');
            tenant = await prisma.tenant.create({
                data: { id: tenantId, name: 'Test Tenant', rut: '11111111-1' }
            });
        }

        const product = await prisma.product.create({
            data: {
                name: 'Kardex Test Product ' + timestamp,
                price: 1000,
                tenantId: tenantId,
                inventory: {
                    create: {
                        branchId: 'branch-1',
                        quantity: 100,
                    }
                },
                stockMovements: {
                    create: {
                        branchId: 'branch-1',
                        quantity: 100,
                        type: 'INITIAL',
                        balance: 100,
                        reference: 'Test Initial',
                    }
                }
            }
        });
        console.log(`✅ Product created: ${product.id}`);

        // Verify Initial Movement
        const initialMovement = await prisma.stockMovement.findFirst({
            where: { productId: product.id, type: 'INITIAL' }
        });
        if (!initialMovement || Number(initialMovement.quantity) !== 100) {
            throw new Error('❌ Initial StockMovement failed');
        }
        console.log('✅ Initial StockMovement verified');

        // 2. Simulate Sale (Using exact logic from SalesService)
        console.log('2. Simulating Sale (Qty: 5)...');
        // Manually create movement as SalesService would
        const soldQty = 5;
        await prisma.$transaction(async (tx) => {
            // Decrement Inventory
            await tx.inventoryLevel.update({
                where: { productId_branchId: { productId: product.id, branchId: 'branch-1' } },
                data: { quantity: { decrement: soldQty } }
            });

            // Log Movement
            const currentBalance = Number(initialMovement.balance);
            await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    branchId: 'branch-1',
                    quantity: -soldQty,
                    type: 'SALE',
                    balance: currentBalance - soldQty,
                    reference: 'Test Sale',
                }
            });
        });

        // Verify Sale Movement
        const saleMovement = await prisma.stockMovement.findFirst({
            where: { productId: product.id, type: 'SALE' }
        });
        if (!saleMovement || Number(saleMovement.quantity) !== -5) {
            throw new Error('❌ Sale StockMovement failed');
        }
        console.log('✅ Sale StockMovement verified');

        // 3. Verify Final Balance
        const finalInventory = await prisma.inventoryLevel.findUnique({
            where: { productId_branchId: { productId: product.id, branchId: 'branch-1' } }
        });
        if (!finalInventory || Number(finalInventory.quantity) !== 95) {
            throw new Error(`❌ Final Inventory incorrect. Expected 95, got ${finalInventory?.quantity}`);
        }
        console.log('✅ Final Inventory verified');

        // Cleanup
        console.log('🧹 Cleaning up...');
        await prisma.stockMovement.deleteMany({ where: { productId: product.id } });
        await prisma.inventoryLevel.deleteMany({ where: { productId: product.id } });
        await prisma.product.delete({ where: { id: product.id } });
        console.log('✨ Cleanup done');

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
