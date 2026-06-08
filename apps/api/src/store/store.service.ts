import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { storeSlug: slug },
      select: {
        id: true,
        name: true,
        storeSlug: true,
        storeSettings: true,
        branches: {
          where: { isMain: true },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    const settings = tenant.storeSettings as any;
    if (!settings?.isActive) {
      throw new NotFoundException('Store is not active');
    }

    return {
      ...tenant,
      mainBranchId: tenant.branches[0]?.id,
    };
  }

  async findFiltersBySlug(slug: string) {
    const tenant = await this.findBySlug(slug);
    const publicFilter = { isPublic: true, isActive: true, tenantId: tenant.id };

    // Return ALL categories and brands defined in the system,
    // with the count of public products in each (may be 0).
    const [categories, brands] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          name: true,
          _count: { select: { products: { where: publicFilter } } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.brand.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          name: true,
          _count: { select: { products: { where: publicFilter } } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { categories, brands };
  }

  async findProductsBySlug(
    slug: string,
    filters?: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
    },
  ) {
    const tenant = await this.findBySlug(slug);

    const where: any = {
      tenantId: tenant.id,
      isPublic: true,
      isActive: true,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brandId) where.brandId = filters.brandId;

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = Number(filters.minPrice);
      if (filters.maxPrice) where.price.lte = Number(filters.maxPrice);
    }

    let orderBy: any = { name: 'asc' };
    if (filters?.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (filters?.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (filters?.sort === 'newest') orderBy = { createdAt: 'desc' };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        description: true,
        image: true,
        unitType: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        inventory: { select: { quantity: true } },
        priceTiers: {
          select: { minQuantity: true, unitPrice: true },
          orderBy: { minQuantity: 'asc' },
        },
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      description: p.description,
      image: p.image,
      unitType: p.unitType,
      category: p.category,
      brand: p.brand,
      priceTiers: p.priceTiers,
      stock: p.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0),
    }));
  }

  async updateStoreSettings(tenantId: string, settings: any) {
    if (settings.storeSlug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { storeSlug: settings.storeSlug },
      });
      if (existing && existing.id !== tenantId) {
        throw new Error('Slug already taken');
      }
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(settings.name ? { name: settings.name } : {}),
        storeSlug: settings.storeSlug,
        storeSettings: settings.storeSettings,
      },
    });
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, storeSlug: true, storeSettings: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    return tenant;
  }
}
