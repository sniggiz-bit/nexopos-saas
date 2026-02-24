import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('products')
  async getProducts() {
    const products = await this.prisma.product.findMany({
      include: { inventory: true, tenant: true },
      take: 20,
    });
    return {
      count: products.length,
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        tenantId: p.tenantId,
        tenantName: p.tenant?.name,
        inventory: p.inventory,
      })),
    };
  }
}
