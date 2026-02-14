import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; address?: string; isMain?: boolean; tenantId: string }) {
        // 1. Create the branch
        const branch = await this.prisma.branch.create({
            data,
        });

        // 2. Initialize inventory for all existing products of this tenant
        // Get all products for this tenant
        const products = await this.prisma.product.findMany({
            where: { tenantId: data.tenantId },
            select: { id: true },
        });

        if (products.length > 0) {
            // Create inventory records for each product
            await this.prisma.inventory.createMany({
                data: products.map((product) => ({
                    productId: product.id,
                    branchId: branch.id,
                    quantity: 0,
                    minStock: 0,
                })),
                skipDuplicates: true,
            });
        }

        return branch;
    }

    async findAll(tenantId: string) {
        return this.prisma.branch.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.branch.findUnique({
            where: { id },
        });
    }
}
