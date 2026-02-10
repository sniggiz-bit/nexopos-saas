import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        private dteService: DteService,
    ) { }

    async createSale(createSaleDto: CreateSaleDto) {
        const { tenantId, branchId, userId, items, paymentMethod } = createSaleDto;

        // Validate items array is not empty
        if (!items || items.length === 0) {
            throw new BadRequestException('Sale must contain at least one item');
        }

        // ============================================
        // ACID TRANSACTION - All or Nothing
        // ============================================
        const sale = await this.prisma.$transaction(async (prisma) => {
            // 1. Validate all products exist and fetch their prices from DB
            const productIds = items.map(item => item.productId);
            const products = await prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    tenantId, // Ensure products belong to the tenant (security)
                },
            });

            if (products.length !== productIds.length) {
                const foundIds = products.map(p => p.id);
                const missingIds = productIds.filter(id => !foundIds.includes(id));
                throw new BadRequestException(
                    `Products not found or don't belong to tenant: ${missingIds.join(', ')}`
                );
            }

            // Create a map for quick price lookup
            const productPriceMap = new Map(
                products.map(p => [p.id, p.price])
            );

            // 2. Validate stock availability for ALL items BEFORE processing
            for (const item of items) {
                const inventory = await prisma.inventoryLevel.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId,
                        },
                    },
                });

                if (!inventory) {
                    throw new BadRequestException(
                        `Product ${item.productId} not found in branch inventory`
                    );
                }

                if (inventory.quantity < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${item.productId}. Available: ${inventory.quantity}, Requested: ${item.quantity}`
                    );
                }
            }

            // 3. All validations passed - now execute the sale
            // Decrement stock for all items
            for (const item of items) {
                await prisma.inventoryLevel.update({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId,
                        },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });
            }

            // 4. Calculate total using DB prices (SECURITY: Never trust client prices)
            const total = items.reduce((acc, item) => {
                const priceFromDB = Number(productPriceMap.get(item.productId) || 0);
                return acc + (priceFromDB * item.quantity);
            }, 0);

            // 5. Create Sale and SaleItems
            const sale = await prisma.sale.create({
                data: {
                    tenantId,
                    branchId,
                    userId,
                    total,
                    paymentMethod,
                    items: {
                        create: items.map((item) => {
                            const priceFromDB = Number(productPriceMap.get(item.productId) || 0);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price: priceFromDB, // Use DB price, not client price
                            };
                        }),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true, // Include product details in response
                        },
                    },
                    branch: true,
                    user: true,
                },
            });

            return sale;
        });

        // ============================================
        // DTE EMISSION - OUTSIDE TRANSACTION
        // ============================================
        // Emit DTE after successful sale (non-blocking, independent of sale transaction)
        // If DTE fails, the sale is still valid - DTE can be retried later
        this.dteService.emitirDte(sale.id).catch((error) => {
            console.error(`[Sales Service] Error emitiendo DTE para venta ${sale.id}:`, error);
            // In production, you might want to queue this for retry
        });

        return sale;
    }
}
