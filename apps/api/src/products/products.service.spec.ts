import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('ProductsService (Referential Integrity)', () => {
  let service: ProductsService;

  const mockPrismaService = {
    product: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    inventory: { deleteMany: jest.fn(), count: jest.fn() },
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    $transaction: jest.fn(async (operation: unknown) => {
      if (typeof operation === 'function') return operation(mockPrismaService);
      return Promise.all(operation as Promise<unknown>[]);
    }),
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

    it('rejects creating an active product with an SKU already in use', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'existing-product' });

      await expect(service.create({
        name: 'Producto nuevo',
        price: 1000,
        tenantId: 'tenant-1',
        sku: 'SKU-1',
      })).rejects.toThrow(ConflictException);
      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          isActive: true,
          sku: { equals: 'SKU-1', mode: 'insensitive' },
        },
        select: { id: true },
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

    it('rejects changing an SKU to one already used by another active product', async () => {
      mockPrismaService.product.findFirst
        .mockResolvedValueOnce({ id: 'p1', tenantId: 'tenant-1', sku: 'SKU-1' })
        .mockResolvedValueOnce({ id: 'p2' });

      await expect(service.update('p1', 'tenant-1', { sku: 'SKU-2' }))
        .rejects.toThrow(ConflictException);
      expect(mockPrismaService.product.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          tenantId: 'tenant-1',
          isActive: true,
          sku: { equals: 'SKU-2', mode: 'insensitive' },
          NOT: { id: 'p1' },
        },
        select: { id: true },
      });
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
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant-1', isActive: true },
      }));
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

  describe('duplicate product cleanup', () => {
    const productRow = (
      id: string,
      sku: string | null,
      barcode: string | null = null,
      stock = 0,
    ) => ({
      id,
      name: `Producto ${id}`,
      sku,
      barcode,
      price: 1000,
      costPrice: 500,
      stock: null,
      category: null,
      brand: null,
      _count: {
        saleItems: 0,
        quoteItems: 0,
        stockMovements: 0,
        transferItems: 0,
        purchaseItems: 0,
        ecommerceMappings: 0,
      },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      inventory: stock === 0
        ? []
        : [{
          branchId: 'branch-1',
          quantity: stock,
          branch: { name: 'Sucursal principal' },
        }],
    });

    it('groups products by normalized SKU and falls back to barcode without SKU', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('sku-1', ' SKU-1 '),
        productRow('sku-2', 'sku-1'),
        productRow('barcode-1', null, 'EAN-1'),
        productRow('barcode-2', '', ' ean-1 '),
        productRow('unique', 'SKU-UNIQUE'),
      ]);

      const groups = await service.findDuplicateProducts('tenant-1');

      expect(groups).toHaveLength(2);
      expect(groups).toEqual(expect.arrayContaining([
        expect.objectContaining({
          identifierType: 'SKU',
          identifierValue: ' SKU-1 ',
          products: expect.arrayContaining([
            expect.objectContaining({ id: 'sku-1' }),
            expect.objectContaining({ id: 'sku-2' }),
          ]),
        }),
        expect.objectContaining({
          identifierType: 'BARCODE',
          identifierValue: 'EAN-1',
          products: expect.arrayContaining([
            expect.objectContaining({ id: 'barcode-1' }),
            expect.objectContaining({ id: 'barcode-2' }),
          ]),
        }),
      ]));
    });

    it('soft-deactivates selected duplicate products within the tenant', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('keep', 'SKU-1'),
        productRow('duplicate', 'SKU-1'),
      ]);
      mockPrismaService.product.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.deactivateDuplicateProducts('tenant-1', ['duplicate']);

      expect(result).toEqual({ deactivated: 1 });
      expect(mockPrismaService.product.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          isActive: true,
          id: { in: ['duplicate'] },
        },
        data: { isActive: false },
      });
    });

    it('refuses to deactivate every product in a duplicate group', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('duplicate-1', 'SKU-1'),
        productRow('duplicate-2', 'SKU-1'),
      ]);

      await expect(
        service.deactivateDuplicateProducts('tenant-1', ['duplicate-1', 'duplicate-2']),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.product.updateMany).not.toHaveBeenCalled();
    });

    it('refuses products with stock and IDs outside duplicate groups', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('keep', 'SKU-1'),
        productRow('with-stock', 'SKU-1', null, 3),
      ]);

      await expect(
        service.deactivateDuplicateProducts('tenant-1', ['with-stock']),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.deactivateDuplicateProducts('tenant-1', ['unrelated']),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.product.updateMany).not.toHaveBeenCalled();
    });

    it('permanently deletes selected duplicates without stock or history', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('keep', 'SKU-1'),
        productRow('duplicate', 'SKU-1'),
      ]);
      mockPrismaService.inventory.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.inventory.count.mockResolvedValue(0);
      mockPrismaService.product.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.product.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.cleanupDuplicateProducts('tenant-1', ['duplicate']);

      expect(result).toEqual({ deleted: 1, deactivated: 0, protectedProducts: [] });
      expect(mockPrismaService.product.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isActive: true, id: { in: ['duplicate'] } },
      });
      expect(mockPrismaService.inventory.deleteMany).toHaveBeenCalledWith({
        where: { productId: { in: ['duplicate'] }, quantity: 0 },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('deactivates and reports duplicates with stock or sales history', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('keep', 'SKU-1'),
        productRow('with-stock', 'SKU-1', null, 3),
        {
          ...productRow('with-sales', 'SKU-1'),
          _count: {
            saleItems: 2,
            quoteItems: 0,
            stockMovements: 0,
            transferItems: 0,
            purchaseItems: 0,
            ecommerceMappings: 0,
          },
        },
      ]);
      mockPrismaService.inventory.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.inventory.count.mockResolvedValue(0);
      mockPrismaService.product.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.product.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.cleanupDuplicateProducts('tenant-1', ['with-stock', 'with-sales']);

      expect(result).toEqual({
        deleted: 0,
        deactivated: 2,
        protectedProducts: [
          expect.objectContaining({
            id: 'with-stock',
            reasons: ['Stock: Sucursal principal (3)'],
          }),
          expect.objectContaining({
            id: 'with-sales',
            reasons: ['Historial asociado: 2 ventas'],
          }),
        ],
      });
      expect(mockPrismaService.product.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isActive: true, id: { in: ['with-stock', 'with-sales'] } },
        data: { isActive: false },
      });
    });

    it('does not allow cleanup to remove every product in a duplicate group', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        productRow('duplicate-1', 'SKU-1'),
        productRow('duplicate-2', 'SKU-1'),
      ]);

      await expect(
        service.cleanupDuplicateProducts('tenant-1', ['duplicate-1', 'duplicate-2']),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});
