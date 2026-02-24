import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCategoryDto {
  name: string;
  tenantId: string;
}

interface UpdateCategoryDto {
  name?: string;
}

interface CategoryResponseDto {
  id: string;
  name: string;
  productCount?: number;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      productCount: cat._count.products,
    }));
  }

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check for duplicate name in tenant
    const existing = await this.prisma.category.findFirst({
      where: {
        name: createCategoryDto.name,
        tenantId: createCategoryDto.tenantId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists for this tenant`,
      );
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    return {
      id: category.id,
      name: category.name,
      productCount: 0,
    };
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      productCount: category._count.products,
    };
  }

  async remove(id: string): Promise<void> {
    // Check if category has products
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        `Cannot delete category with ${category._count.products} associated products`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
