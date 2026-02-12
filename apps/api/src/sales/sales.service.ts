import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
import { CreditsService } from '../credits/credits.service';
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
        private creditsService: CreditsService,
    ) { }

    /**
     * Get all sales with optional filters
     */
    async getSales(filters: GetSalesFilters = {}) {
        const { startDate, endDate, branchId } = filters;
        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (branchId) where.branchId = branchId;

        return this.prisma.sale.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { include: { product: true } },
                branch: true,
                user: true,
                customer: true,
                credit: true,
            },
        });
    }

    async createSale(createSaleDto: CreateSaleDto) {
        const { tenantId, branchId, userId, items, payments, status = 'COMPLETED', customerId, quoteId } = createSaleDto;

        if (!items || items.length === 0) {
            throw new BadRequestException('Sale must contain at least one item');
        }

        // Logic for Pre-sales:
        // - Allow 0 payments if PRE_SALE
        if (status === 'COMPLETED') {
            if (!payments || payments.length === 0) {
                throw new BadRequestException('Sale must contain at least one payment method');
            }
        }

        // Validate Credit Payment
        const hasCreditPayment = payments?.some(p => p.paymentMethod === 'CREDITO');
        if (hasCreditPayment && !customerId) {
            throw new BadRequestException('Customer is required for CREDIT payments');
        }

        const sale = await this.prisma.$transaction(async (prisma) => {
            // 1. Validate products
            const productIds = items.map(item => item.productId);
            const products = await prisma.product.findMany({
                where: { id: { in: productIds }, tenantId },
            });

            if (products.length !== productIds.length) {
                throw new BadRequestException('Some products were not found');
            }

            // 1.5. Validate Open Shift
            const currentShift = await prisma.cashShift.findFirst({
                where: { branchId, status: 'OPEN' },
            });

            if (!currentShift) {
                throw new BadRequestException('No open shift found. Please open a shift first.');
            }

            const productPriceMap = new Map(products.map(p => [p.id, p.price]));

            // 2. Validate and Update Stock
            for (const item of items) {
                const inventory = await prisma.inventoryLevel.findUnique({
                    where: { productId_branchId: { productId: item.productId, branchId } },
                });

                if (!inventory || inventory.quantity.lessThan(item.quantity)) {
                    throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
                }

                await prisma.inventoryLevel.update({
                    where: { productId_branchId: { productId: item.productId, branchId } },
                    data: { quantity: { decrement: item.quantity } },
                });
            }

            // 3. Calculate Total
            const total = items.reduce((acc, item) => {
                const price = Number(productPriceMap.get(item.productId) || 0);
                return acc + (price * Number(item.quantity));
            }, 0);

            // 4. Validate Payments (only for COMPLETED)
            if (status === 'COMPLETED') {
                const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
                if (Math.abs(totalPaid - total) > 0.01) {
                    throw new BadRequestException(`Paid amount ($${totalPaid}) does not match total ($${total})`);
                }
            }

            // 5. Create Sale
            const createdSale = await prisma.sale.create({
                data: {
                    tenantId,
                    branchId,
                    userId,
                    cashShiftId: currentShift.id,
                    total,
                    status,
                    customerId,
                    quoteId,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: Number(productPriceMap.get(item.productId) || 0),
                        })),
                    },
                    payments: {
                        create: payments?.map(p => ({
                            paymentMethod: p.paymentMethod,
                            amount: p.amount,
                        })),
                    },
                },
                include: { items: { include: { product: true } }, payments: true, customer: true },
            });

            // 6. Handling Credit Creation
            if (status === 'COMPLETED' && hasCreditPayment) {
                const creditAmount = payments
                    .filter(p => p.paymentMethod === 'CREDITO')
                    .reduce((acc, p) => acc + p.amount, 0);

                await prisma.credit.create({
                    data: {
                        tenantId,
                        customerId: customerId!,
                        saleId: createdSale.id,
                        totalAmount: creditAmount,
                        balance: creditAmount,
                        status: 'OPEN',
                    }
                });
            }

            return createdSale;
        });

        // Post-Sale Actions (DTE, etc)
        if (sale.status === 'COMPLETED') {
            this.emitDteAndReceipt(sale.id);
        }

        return sale;
    }

    async completePreSale(id: string, payments: CreatePaymentDto[]) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!sale) throw new NotFoundException('Sale not found');
        if (sale.status !== 'PRE_SALE') throw new BadRequestException('Sale is not a pre-sale');

        // Validate Payments matching total
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        if (Math.abs(totalPaid - sale.total) > 0.01) {
            throw new BadRequestException(`Paid amount ($${totalPaid}) does not match total ($${sale.total})`);
        }

        // Validate Credit
        const hasCreditPayment = payments.some(p => p.paymentMethod === 'CREDITO');
        if (hasCreditPayment && !sale.customerId) {
            throw new BadRequestException('Customer is required for CREDIT payments');
        }

        await this.prisma.$transaction(async (prisma) => {
            // 1. Add payments
            await prisma.payment.createMany({
                data: payments.map(p => ({
                    saleId: id,
                    amount: p.amount,
                    paymentMethod: p.paymentMethod as any, // Cast enum
                })),
            });

            // 2. Update status
            await prisma.sale.update({
                where: { id },
                data: { status: 'COMPLETED' },
            });

            // 3. Create Credit if needed
            if (hasCreditPayment) {
                const creditAmount = payments
                    .filter(p => p.paymentMethod === 'CREDITO')
                    .reduce((acc, p) => acc + p.amount, 0);

                await prisma.credit.create({
                    data: {
                        tenantId: sale.tenantId,
                        customerId: sale.customerId!,
                        saleId: sale.id,
                        totalAmount: creditAmount,
                        balance: creditAmount,
                        status: 'OPEN',
                    }
                });
            }
        });

        // Emit DTE/Receipt
        this.emitDteAndReceipt(id);

        return this.prisma.sale.findUnique({
            where: { id },
            include: { items: true, payments: true, customer: true, credit: true },
        });
    }

    private async emitDteAndReceipt(saleId: string) {
        try {
            await this.dteService.emitirDte(saleId);
        } catch (e) {
            this.logger.error(`Failed to emit DTE for sale ${saleId}`, e);
        }

        try {
            await this.internalReceiptService.generateReceipt(saleId);
        } catch (e) {
            this.logger.error(`Failed to generate receipt for sale ${saleId}`, e);
        }
    }
}
