
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Kardex Verification...');

    try {
        // 1. Create Product with Initial Stock
        console.log('1. Creating Product with Initial Stock (100)...');
        const product = await prisma.product.create({
            data: {
                name: 'Kardex Test Product ' + Date.now(),
                price: 1000,
                tenantId: 'tenant-1',
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
            await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    branchId: 'branch-1',
                    quantity: -soldQty,
                    type: 'SALE',
                    balance: Number(initialMovement.balance) - soldQty,
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
        await prisma.stockMovement.deleteMany({ where: { productId: product.id } });
        await prisma.inventoryLevel.deleteMany({ where: { productId: product.id } });
        await prisma.product.delete({ where: { id: product.id } });
        console.log('🧹 Cleanup done');

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
