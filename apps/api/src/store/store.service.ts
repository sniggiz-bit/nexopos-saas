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

  async findProductsBySlug(slug: string, search?: string) {
    const tenant = await this.findBySlug(slug);

    return this.prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isPublic: true,
        isActive: true,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,

        category: {
          select: { name: true },
        },
      },
    });
  }

  async updateStoreSettings(tenantId: string, settings: any) {
    // Validate slug uniqueness if changing
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
        storeSlug: settings.storeSlug,
        storeSettings: settings.storeSettings,
      },
    });
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        storeSlug: true,
        storeSettings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
