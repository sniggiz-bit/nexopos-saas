import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateBrandDto {
  name: string;
  tenantId: string;
}

interface UpdateBrandDto {
  name?: string;
}

interface BrandResponseDto {
  id: string;
  name: string;
  productCount?: number;
}

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) { }

  async findAll(tenantId: string): Promise<BrandResponseDto[]> {
    console.log(`[BrandsService] findAll called with tenantId: "${tenantId}"`);
    try {
      const brands = await this.prisma.brand.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      console.log(`[BrandsService] findAll result count: ${brands.length}`);
      console.log(`[BrandsService] brands raw:`, JSON.stringify(brands));
      return brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        productCount: brand._count.products,
      }));
    } catch (error) {
      console.error(`[BrandsService] findAll ERROR:`, error.message);
      console.error(`[BrandsService] findAll STACK:`, error.stack);
      return [];
    }
  }

  async create(createBrandDto: CreateBrandDto, tenantId: string): Promise<BrandResponseDto> {
    // Check for duplicate name in tenant
    const existing = await this.prisma.brand.findFirst({
      where: {
        name: createBrandDto.name,
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Brand with name "${createBrandDto.name}" already exists for this tenant`,
      );
    }

    const brand = await this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
        tenantId,
      },
    });

    return {
      id: brand.id,
      name: brand.name,
      productCount: 0,
    };
  }

  async update(
    id: string,
    tenantId: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    const brand = await this.prisma.brand.update({
      where: { id, tenantId },
      data: updateBrandDto,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: brand.id,
      name: brand.name,
      productCount: brand._count.products,
    };
  }

  async remove(id: string, tenantId: string): Promise<void> {
    // Check if brand has products
    const brand = await this.prisma.brand.findUnique({
      where: { id, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    if (brand._count.products > 0) {
      throw new ConflictException(
        `Cannot delete brand with ${brand._count.products} associated products`,
      );
    }

    await this.prisma.brand.delete({
      where: { id, tenantId },
    });
  }
}
