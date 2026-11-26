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
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    brand: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    branch: { findFirst: jest.fn() },
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
    jest.restoreAllMocks();
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

  describe('importProducts', () => {
    const productResponse = (id: string, name: string, sku?: string) => ({
      id,
      name,
      sku,
      price: 1000,
      costPrice: 500,
      minStock: 0,
      unitType: 'UNIT' as const,
      galleryImages: [],
      isActive: true,
      isPublic: false,
      stock: 0,
    });

    beforeEach(() => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.brand.findMany.mockResolvedValue([]);
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.brand.findFirst.mockResolvedValue(null);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.branch.findFirst.mockResolvedValue({ id: 'branch-1' });
    });

    it('updates a product matched by SKU and creates missing category and brand references', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'product-1', sku: 'SKU-1', barcode: null },
      ]);
      mockPrismaService.category.create.mockResolvedValue({ id: 'category-new' });
      mockPrismaService.brand.create.mockResolvedValue({ id: 'brand-new' });
      const update = jest.spyOn(service, 'update').mockResolvedValue(
        productResponse('product-1', 'Producto actualizado', 'SKU-1'),
      );

      const result = await service.importProducts('tenant-1', 'branch-1', 'user-1', [{
        rowNumber: 2,
        name: 'Producto actualizado',
        sku: 'SKU-1',
        category: 'Nueva categoría',
        brand: 'Marca nueva',
        price: 1200,
        stock: 7,
        warnings: [],
      }]);

      expect(result.updated).toBe(1);
      expect(result.errors).toBe(0);
      expect(update).toHaveBeenCalledWith(
        'product-1',
        'tenant-1',
        expect.objectContaining({
          name: 'Producto actualizado',
          categoryId: 'category-new',
          brandId: 'brand-new',
          price: 1200,
          stock: 7,
        }),
        'user-1',
        'branch-1',
      );
      expect(result.results[0].warnings).toEqual(expect.arrayContaining([
        'Se creó la categoría "Nueva categoría".',
        'Se creó la marca "Marca nueva".',
      ]));
    });

    it('imports a product without a barcode already owned by another product', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'product-owner', sku: 'SKU-OLD', barcode: '123456' },
      ]);
      const create = jest.spyOn(service, 'create').mockResolvedValue(
        productResponse('product-new', 'Producto nuevo', 'SKU-NEW'),
      );

      const result = await service.importProducts('tenant-1', 'branch-1', 'user-1', [{
        rowNumber: 3,
        name: 'Producto nuevo',
        sku: 'SKU-NEW',
        barcode: '123456',
        price: 1000,
        warnings: [],
      }]);

      expect(result.created).toBe(1);
      expect(result.errors).toBe(0);
      expect(create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Producto nuevo',
        sku: 'SKU-NEW',
        barcode: undefined,
      }));
      expect(result.results[0].warnings).toContain(
        'El código de barras ya pertenece a otro producto; se importó sin ese código.',
      );
    });

    it('updates the same product when an SKU appears again later in the same import', async () => {
      const create = jest.spyOn(service, 'create').mockResolvedValue(
        productResponse('product-new', 'Producto original', 'SKU-REPEATED'),
      );
      const update = jest.spyOn(service, 'update').mockResolvedValue(
        productResponse('product-new', 'Producto actualizado', 'SKU-REPEATED'),
      );

      const result = await service.importProducts('tenant-1', 'branch-1', 'user-1', [
        { rowNumber: 2, name: 'Producto original', sku: 'SKU-REPEATED', price: 1000 },
        { rowNumber: 3, name: 'Producto actualizado', sku: 'SKU-REPEATED', price: 1500 },
      ]);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(create).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(
        'product-new',
        'tenant-1',
        expect.objectContaining({ name: 'Producto actualizado', price: 1500 }),
        'user-1',
        'branch-1',
      );
    });
  });
});
