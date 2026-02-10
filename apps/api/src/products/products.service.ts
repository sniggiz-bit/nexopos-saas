import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all products with calculated stock from InventoryLevel
     * @param tenantId - Tenant ID for multi-tenancy
     * @param branchId - Branch ID to calculate stock (defaults to 'branch-1')
     * @returns Array of products with stock information
     */
    async findAll(
        tenantId: string,
        branchId: string = 'branch-1',
    ): Promise<ProductResponseDto[]> {
        // Fetch products with their inventory levels for the specified branch
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
            },
            include: {
                inventory: {
                    where: {
                        branchId,
                    },
                },
            },
        });

        // Transform to response DTO with calculated stock
        return products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.inventory.reduce(
                (total, inv) => total + inv.quantity,
                0,
            ),
            sku: product.sku || undefined,
        }));
    }
}
