import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService (Referential Integrity)', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    brand: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Product',
      price: 1000,
      tenantId: 'tenant-1',
      categoryId: 'category-foreign',
      brandId: 'brand-foreign',
    };

    it('should throw NotFoundException if category does not belong to tenant', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null); // Category not found for this tenant

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'category-foreign', tenantId: 'tenant-1' },
      });
    });

    it('should throw NotFoundException if brand does not belong to tenant', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'category-foreign' });
      mockPrismaService.brand.findFirst.mockResolvedValue(null); // Brand not found for this tenant

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.brand.findFirst).toHaveBeenCalledWith({
        where: { id: 'brand-foreign', tenantId: 'tenant-1' },
      });
    });
  });

  describe('update', () => {
    const updateDto = {
      categoryId: 'category-foreign',
      brandId: 'brand-foreign',
    };

    it('should throw NotFoundException if category does not belong to tenant on update', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' });
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(service.update('p1', 'tenant-1', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if brand does not belong to tenant on update', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' });
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'category-foreign' });
      mockPrismaService.brand.findFirst.mockResolvedValue(null);

      await expect(service.update('p1', 'tenant-1', updateDto)).rejects.toThrow(NotFoundException);
    });
  });
});
