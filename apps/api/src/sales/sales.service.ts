import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async createSale(createSaleDto: CreateSaleDto) {
        const { tenantId, branchId, userId, items } = createSaleDto;

        return this.prisma.$transaction(async (prisma) => {
            // 1. Calculate total
            const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

            // 2. Iterate items to check stock and decrement
            for (const item of items) {
                // Find current inventory
                const inventory = await prisma.inventoryLevel.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId,
                        },
                    },
                });

                if (!inventory) {
                    throw new BadRequestException(`Product ${item.productId} not found in branch inventory`);
                }

                if (inventory.quantity < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for product ${item.productId}. Available: ${inventory.quantity}, Requested: ${item.quantity}`);
                }

                // 3. Decrement stock
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

            // 4. Create Sale and SaleItems
            const sale = await prisma.sale.create({
                data: {
                    tenantId,
                    branchId,
                    userId,
                    total,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            return sale;
        });
    }
}
