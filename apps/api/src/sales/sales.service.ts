import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import * as path from 'path';

interface GetSalesFilters {
    startDate?: string;
    endDate?: string;
    branchId?: string;
}

@Injectable()
export class SalesService {
    private readonly logger = new Logger(SalesService.name);

    constructor(
        private prisma: PrismaService,
        private dteService: DteService,
        private internalReceiptService: InternalReceiptService,
    ) { }

    /**
     * Get all sales with optional filters
     * 
     * @param filters - Optional filters for date range and branch
     * @returns Array of sales with items, products, branch, and user data
     */
    async getSales(filters: GetSalesFilters = {}) {
        const { startDate, endDate, branchId } = filters;

        // Build the where clause dynamically based on provided filters
        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        if (branchId) {
            where.branchId = branchId;
        }

        return this.prisma.sale.findMany({
            where,
            orderBy: {
                createdAt: 'desc', // Most recent first
            },
            include: {
                items: {
                    include: {
                        product: true, // Include product details for each item
                    },
                },
                branch: true,
                user: true,
            },
        });
    }

    async createSale(createSaleDto: CreateSaleDto) {
        const logFile = 'C:\\Users\\user\\sales-debug.log';
        const log = (msg: string) => {
            const time = new Date().toISOString();
            const fs = require('fs');
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
            this.logger.log(msg);
        };

        log(`[Sales Service] Starting creation of sale for tenant ${createSaleDto.tenantId}`);
        // Log the DTO for detail
        log(`- Items count: ${createSaleDto.items.length}`);
        log(`- Payments count: ${createSaleDto.payments.length}`);
        const { tenantId, branchId, userId, items, payments } = createSaleDto;

        // Validate items array is not empty
        if (!items || items.length === 0) {
            throw new BadRequestException('Sale must contain at least one item');
        }

        // Validate payments array is not empty
        if (!payments || payments.length === 0) {
            throw new BadRequestException('Sale must contain at least one payment method');
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

            // 1.5. Validate Open Shift
            let currentShift = await prisma.cashShift.findFirst({
                where: {
                    branchId,
                    status: 'OPEN',
                },
            });

            if (!currentShift) {
                throw new BadRequestException('No hay turno de caja abierto. Debe abrir caja para realizar ventas.');
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
                return acc + (priceFromDB * Number(item.quantity));
            }, 0);

            // 5. Validate total payments match sale total
            const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
            if (Math.abs(totalPaid - total) > 0.01) {
                throw new BadRequestException(`El total pagado ($${totalPaid}) no coincide con el total de la venta ($${total}).`);
            }

            // 6. Create Sale, SaleItems, and Payments
            const sale = await prisma.sale.create({
                data: {
                    tenantId,
                    branchId,
                    userId,
                    cashShiftId: currentShift.id,
                    total,
                    items: {
                        create: items.map((item) => {
                            const priceFromDB = Number(productPriceMap.get(item.productId) || 0);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price: priceFromDB,
                            };
                        }),
                    },
                    payments: {
                        create: payments.map((p) => ({
                            paymentMethod: p.paymentMethod,
                            amount: p.amount,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                    branch: true,
                    user: true,
                },
            });

            return sale;
        });

        // ============================================
        // DTE EMISSION - SYNC FOR FRONTEND FEEDBACK
        // ============================================
        log(`[Sales Service] Emitting DTE for sale ${sale.id}...`);
        try {
            await this.dteService.emitirDte(sale.id);
            log(`- DTE emitted successfully`);
        } catch (error) {
            log(`- DTE emission FAILED: ${error.message}`);
            this.logger.error(`[Sales Service] Error emitiendo DTE para venta ${sale.id}:`, error.message);
        }

        // ============================================
        // INTERNAL RECEIPT GENERATION
        // ============================================
        log(`[Sales Service] Requesting internal receipt for sale ${sale.id}...`);
        try {
            await this.internalReceiptService.generateReceipt(sale.id);
            log(`- Internal receipt generated successfully`);
        } catch (error) {
            log(`- Internal receipt generation FAILED: ${error.message}`);
            this.logger.error(`[Sales Service] Error generando ticket interno para venta ${sale.id}:`, error.message);
        }

        // Fetch the updated sale with DTE data and receipt URL
        log(`[Sales Service] Fetching final sale object...`);
        const finalSale = await this.prisma.sale.findUnique({
            where: { id: sale.id },
            include: {
                items: { include: { product: true } },
                payments: true,
                branch: true,
                user: true,
            },
        });

        return finalSale;
    }
}
